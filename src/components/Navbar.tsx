"use client";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-md w-full">
      <nav className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo with Name + Slogan Unified */}
        <div className="flex items-center space-x-2">
          <Image
            src="/waardian_ai_logo.svg"
            alt="Waardian Logo"
            width={40}
            height={40}
            className="shrink-0"
          />
          <div className="leading-[1.1] flex flex-col">
            <span className="text-[17px] font-semibold tracking-tight leading-[1.2]">
              Waardian
            </span>
            <span className="text-[11px] text-gray-400">
            Your Digital Gatekeeper.
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-6 text-sm font-medium">
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative group">
              <span className="cursor-pointer">Features ▾</span>
              <div className="absolute hidden group-hover:block bg-white text-black mt-2 rounded shadow p-2 space-y-1 z-50">
                <Link href="#">Resident</Link>
                <Link href="#">Visitor</Link>
                <Link href="#">Security</Link>
              </div>
            </div>
            <Link href="#">About</Link>
            <Link href="#">Blog</Link>
            <div className="relative group">
              <span className="cursor-pointer">Support ▾</span>
              <div className="absolute hidden group-hover:block bg-white text-black mt-2 rounded shadow p-2 space-y-1 z-50">
                <Link href="#">Contact</Link>
                <Link href="#">Help</Link>
              </div>
            </div>
          </div>

          <Link
            href="http://localhost:4200/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
