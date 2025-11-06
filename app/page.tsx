import Link from "next/link";

// ---
// Define your pages here. This makes it easy to add more in the future.
// ---
const myPages = [
  {
    href: "/counter",
    title: "Counter",
    description: "A simple interactive counter using the useState hook.",
  },
  {
    href: "/prompts",
    title: "Prompts",
    description: "A simple prompt listing",
  },
  {
    href: "/#", // You can update this when you have a new page
    title: "Coming Soon",
    description: "Add your next page link here in the myPages array.",
  },
  // Add more pages here as needed
];

export default function Home() {
  return (
    // Main container: 
    // Centers everything vertically and horizontally in the middle of the screen.
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-16 font-sans dark:bg-black">
      
      {/* Content wrapper: 
          Sets a max width for your content and centers the title. */}
      <main className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          My Project Pages
        </h1>
        
        {/* Grid layout for the links. Scales to 2 columns on small screens and up. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {myPages.map((page) => (
            <Link
              key={page.title}
              href={page.href}
              // 'group' is a Tailwind utility to apply styles on children when hovering the parent
              className="group block rounded-lg border border-solid border-black/[.08] p-5 transition-all hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              <h3 className="mb-1 text-lg font-medium text-black dark:text-zinc-50">
                {page.title}{" "}
                {/* This arrow moves slightly on hover */}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  →
                </span>
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}