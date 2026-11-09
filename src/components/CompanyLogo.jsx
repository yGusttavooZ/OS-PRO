import { useEffect, useState } from "react";

import { Image } from "@/components/ui/image";

export function useCompanyLogo(fileUri) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let alive = true;
    if (!fileUri) {
      setUrl("");
      return;
    }
    if (/^https?:\/\//i.test(fileUri)) {
      setUrl(fileUri);
      return;
    }
    setUrl(fileUri);
    return () => {
      alive = false;
    };
  }, [fileUri]);

  return url;
}

export default function CompanyLogo({ company, className, fittingType = "fit", fallback = null }) {
  const url = useCompanyLogo(company?.logo_url);
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
