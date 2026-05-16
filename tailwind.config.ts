import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        nutrigreen: {
          DEFAULT: "#30D158",
          light: "#34C759",
          dark: "#248A3D",
        },
        nutriblue: {
          DEFAULT: "#0A84FF",
          light: "#409CFF",
          dark: "#0056CC",
        },
        nutripurple: {
          DEFAULT: "#BF5AF2",
          light: "#DA8FFF",
          dark: "#8944AB",
        },
        nutriorange: {
          DEFAULT: "#FF9F0A",
          light: "#FFB340",
          dark: "#C93400",
        },
        nutrired: {
          DEFAULT: "#FF453A",
          light: "#FF6961",
          dark: "#C4232A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "1" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "pulse-ring": "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        float: "float 3s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Segoe UI", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-sm": "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        "neon-green": "0 0 20px rgba(48, 209, 88, 0.3)",
        "neon-blue": "0 0 20px rgba(10, 132, 255, 0.3)",
        "neon-purple": "0 0 20px rgba(191, 90, 242, 0.3)",
        card: "0 20px 60px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
