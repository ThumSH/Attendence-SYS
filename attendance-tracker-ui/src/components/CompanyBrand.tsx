import companyLogo from "../assets/company-logo.svg";

interface CompanyBrandProps {
  variant?: "login" | "print";
  subtitle?: string;
}

function CompanyBrand({
  variant = "login",
  subtitle = "Attendance Management System",
}: CompanyBrandProps) {
  return (
    <div
      className={`company-brand company-brand--${variant}`}
    >
      <img
        src={companyLogo}
        alt="Colour Plus Printing Systems logo"
        className="company-brand__logo"
      />

      <div className="company-brand__copy">
        <strong>
          Colour Plus Printing Systems
        </strong>

        <span>
          {subtitle}
        </span>
      </div>
    </div>
  );
}

export default CompanyBrand;
