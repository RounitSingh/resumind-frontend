import Image from "next/image"
import authImage from "@/assets/img.png"

// Image panel shared by the login and sign up cards. The picture is shown in
// full (contain) over a blurred copy of itself, so it fills any card height
// without cropping or visible bars.
export function AuthSidePanel({ alt }: { alt: string }) {
  return (
    <div className="relative hidden overflow-hidden bg-[#070b14] md:block">
      <Image
        src={authImage}
        alt=""
        aria-hidden
        fill
        sizes="448px"
        className="scale-125 object-cover opacity-60 blur-2xl"
      />
      <Image
        src={authImage}
        alt={alt}
        fill
        priority
        sizes="448px"
        className="object-contain"
      />
    </div>
  )
}
