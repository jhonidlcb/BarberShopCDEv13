import { Navigation } from '@/components/navigation';
import { BookingSection } from '@/components/booking-section';
import { Footer } from '@/components/footer';

export default function Booking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-16"> {/* Account for fixed navigation */}
        <BookingSection />
      </div>
      <Footer />
    </div>
  );
}