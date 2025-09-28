
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dialCode: "+595" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { code: "ES", name: "España", flag: "🇪🇸", dialCode: "+34" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  "data-testid"?: string;
}

export const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value, onChange, placeholder = "Número de teléfono", className, required, "data-testid": testId, ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries[0]);
    const [phoneNumber, setPhoneNumber] = React.useState("");

    React.useEffect(() => {
      // Parse existing value to extract country code and number
      if (value && value.startsWith("+")) {
        const country = countries.find(c => value.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(value.replace(country.dialCode, "").trim());
        }
      } else if (value) {
        setPhoneNumber(value);
      }
    }, []);

    const handleCountryChange = (countryCode: string) => {
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        setSelectedCountry(country);
        const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : country.dialCode;
        onChange(fullNumber);
      }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const number = e.target.value;
      setPhoneNumber(number);
      const fullNumber = number ? `${selectedCountry.dialCode} ${number}` : selectedCountry.dialCode;
      onChange(fullNumber);
    };

    return (
      <div ref={ref} className={cn("flex", className)} data-testid={testId}>
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[120px] rounded-r-none border-r-0">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.dialCode}</span>
                  <span className="text-muted-foreground">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="rounded-l-none flex-1"
          required={required}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
