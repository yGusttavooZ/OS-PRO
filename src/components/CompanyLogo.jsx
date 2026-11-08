import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
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
    (async () => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 3600,
        });
        if (alive) setUrl(signed_url || "");
      } catch {
        if (alive) setUrl("");
      }
    })();
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
