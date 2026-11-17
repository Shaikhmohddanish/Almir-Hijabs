import Image from "next/image";
import type { ImageKind } from "../catalog";

// One frame for every product picture: cut-outs and white-studio shots sit on the sand,
// grey-studio shots fill the frame, and a product without a photo is set in type.
export default function ProductImage({ src, kind = "cutout", name, sizes, priority = false }: { src?: string; kind?: ImageKind; name: string; sizes: string; priority?: boolean }) {
  if (!src) {
    return (
      <div className="pimg pimg--type" aria-hidden="true">
        <span>{name}</span>
      </div>
    );
  }
  return (
    <div className={`pimg pimg--${kind}`} data-slot={`product-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} data-alt={name}>
      <Image src={src} alt={name} fill sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
    </div>
  );
}
