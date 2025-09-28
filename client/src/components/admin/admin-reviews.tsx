
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Trash, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  serviceType?: string;
  approved: boolean;
  createdAt: string;
}

export function AdminReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/admin/reviews'],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reviews/${id}/approve`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error approving review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: 'Reseña aprobada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al aprobar la reseña', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting review');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: 'Reseña eliminada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar la reseña', variant: 'destructive' });
    },
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando reseñas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestión de Reseñas</h3>
        <div className="text-sm text-muted-foreground">
          Total: {reviews?.length || 0} reseñas
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews?.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">
                  {review.customerName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm">({review.rating}/5)</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={review.comment}>
                    {review.comment}
                  </div>
                </TableCell>
                <TableCell>
                  {review.serviceType || 'No especificado'}
                </TableCell>
                <TableCell>
                  {review.approved ? (
                    <Badge>Aprobada</Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {!review.approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate(review.id)}
                        title="Aprobar reseña"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(review.id)}
                      title="Eliminar reseña"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(!reviews || reviews.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          No hay reseñas disponibles
        </div>
      )}
    </div>
  );
}
