import { useEffect, useLayoutEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../lib/motion";

export function MarkdownLightbox({
  image,
  onClose,
}: {
  image: HTMLImageElement;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const origin = image.getBoundingClientRect();
  const width = Math.max(1, image.naturalWidth || 0, origin.width);
  const height = Math.max(1, image.naturalHeight || 0, origin.height);
  const aspect = width / (height || 1);
  const targetWidth = Math.min(width, window.innerWidth * 0.9, window.innerHeight * 0.9 * aspect);
  const targetHeight = targetWidth / aspect;
  const left = (window.innerWidth - targetWidth) / 2;
  const top = (window.innerHeight - targetHeight) / 2;
  const source = reduced
    ? { opacity: 0 }
    : {
        opacity: 1,
        x: origin.left - left,
        y: origin.top - top,
        scaleX: origin.width / targetWidth,
        scaleY: origin.height / targetHeight,
      };
  useLayoutEffect(() => {
    image.style.visibility = "hidden";
    return () => {
      image.style.visibility = "";
    };
  }, [image]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      className="folio-md-lightbox"
      role="button"
      tabIndex={0}
      aria-label="关闭图片预览"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduced ? { duration: 0.12 } : spring.gentle}
    >
      <motion.img
        src={image.src}
        alt="图片预览"
        style={{
          position: "fixed",
          left,
          top,
          width: targetWidth,
          height: targetHeight,
          transformOrigin: "top left",
        }}
        initial={source}
        animate={{ opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 }}
        exit={source}
        transition={reduced ? { duration: 0.12 } : spring.gentle}
      />
    </motion.div>
  );
}
