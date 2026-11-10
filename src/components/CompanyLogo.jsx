import { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";

export function useCompanyLogo(fileUri) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!fileUri) {
      setUrl("");
      return;
    }
    setUrl(fileUri);
  }, [fileUri]);

  return url;
}

export default function CompanyLogo({ company, className, fittingType = "fit", fallback = null }) {
  const url = useCompanyLogo(company?.logo_base64 || company?.logo_url);
  if (!url) return fallback;
  return (
    <Image
      src={url}
      alt={company?.name || "Logotipo da empresa"}
      className={className}
      fittingType={fittingType}
    />
  );
}
