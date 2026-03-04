import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MediaCarousel } from "@/features/layout/MediaCarousel";
import type { FeedMedia } from "@/features/feed/types";
import { uploadFeedMedia } from "@/features/feed/feedApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import {
  createGarageSaleItem,
  fetchGarageSaleItems,
  type GarageSaleItem
} from "@/features/sections/garageSalesApi";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E";

const GARAGE_SALE_CATEGORIES = [
  "Vehicles",
  "Classified",
  "Clothing",
  "Eletronics",
  "Entertainment",
  "Family",
  "Free",
  "Garden and Outdoor",
  "Hobbies",
  "Home Goods",
  "Musical Instruments",
  "Pets",
  "Sporting Goods",
  "Toys and Games"
] as const;

type GarageSaleCategory = (typeof GARAGE_SALE_CATEGORIES)[number];
type SortOption = "NEWEST" | "PRICE_LOW_HIGH" | "PRICE_HIGH_LOW" | "TITLE_A_Z";

const GARAGE_SALES_QUERY_KEY = ["garage-sales"];

export function GarageSalesPage() {
  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    queryKey: GARAGE_SALES_QUERY_KEY,
    queryFn: fetchGarageSaleItems,
    staleTime: 30_000
  });
  const createItemMutation = useMutation({
    mutationFn: createGarageSaleItem,
    onSuccess: (created) => {
      queryClient.setQueryData<GarageSaleItem[]>(GARAGE_SALES_QUERY_KEY, (current) => [created, ...(current ?? [])]);
    }
  });
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });
  const mediaUploadMutation = useMutation({
    mutationFn: (file: File) => uploadFeedMedia(file)
  });

  const [activeCategory, setActiveCategory] = useState<GarageSaleCategory | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [selectedItem, setSelectedItem] = useState<GarageSaleItem | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCondition, setFormCondition] = useState("Used - Good");
  const [formCategory, setFormCategory] = useState<GarageSaleCategory>("Classified");
  const [formDescription, setFormDescription] = useState("");
  const [formMedia, setFormMedia] = useState<FeedMedia[]>([]);

  const visibleItems = useMemo(() => {
    const items = itemsQuery.data ?? [];
    const filtered =
      activeCategory === "ALL" ? [...items] : items.filter((item) => item.category === activeCategory);

    const toPriceNumber = (value: string) => {
      const parsed = Number(value.replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    };

    switch (sortBy) {
      case "PRICE_LOW_HIGH":
        return filtered.sort((a, b) => toPriceNumber(a.price) - toPriceNumber(b.price));
      case "PRICE_HIGH_LOW":
        return filtered.sort((a, b) => toPriceNumber(b.price) - toPriceNumber(a.price));
      case "TITLE_A_Z":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "NEWEST":
      default:
        return filtered;
    }
  }, [activeCategory, itemsQuery.data, sortBy]);

  const hasItems = visibleItems.length > 0;

  const formatPrice = (value: string) => {
    const trimmed = value.trim();
    return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
  };

  const onCreateProduct = (event: FormEvent) => {
    event.preventDefault();
    if (!formTitle.trim() || !formPrice.trim()) return;
    createItemMutation.mutate(
      {
        title: formTitle.trim(),
        price: formPrice.trim(),
        condition: formCondition.trim(),
        category: formCategory,
        description: formDescription.trim() || null,
        media: formMedia
      },
      {
        onSuccess: () => {
          setSellOpen(false);
          setFormTitle("");
          setFormPrice("");
          setFormCondition("Used - Good");
          setFormCategory("Classified");
          setFormDescription("");
          setFormMedia([]);
        }
      }
    );
  };

  const onMediaSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const uploaded: FeedMedia[] = [];
    for (const file of files) {
      const result = await mediaUploadMutation.mutateAsync(file);
      uploaded.push({ type: result.type, url: result.url });
    }
    setFormMedia((current) => [...current, ...uploaded]);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Garage Sales
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Community Marketplace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse neighbor listings and post items you want to sell.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSellOpen(true)}
            className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
          >
            Sell a product
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              activeCategory === "ALL"
                ? "border-leaf-600 bg-leaf-50 text-leaf-900"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {GARAGE_SALE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeCategory === category
                  ? "border-leaf-600 bg-leaf-50 text-leaf-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2 md:w-[260px]"
          >
            <option value="NEWEST">Sort: Newest</option>
            <option value="PRICE_LOW_HIGH">Sort: Price low to high</option>
            <option value="PRICE_HIGH_LOW">Sort: Price high to low</option>
            <option value="TITLE_A_Z">Sort: Title A-Z</option>
          </select>
        </div>
      </section>

      {itemsQuery.isLoading ? <section className="card p-4 text-sm text-slate-600">Loading listings...</section> : null}
      {itemsQuery.isError ? (
        <section className="card p-4 text-sm text-red-600">{(itemsQuery.error as Error).message}</section>
      ) : null}

      {hasItems ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item) => {
            const cover = item.media[0];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {cover?.type === "IMAGE" || cover?.type === "VIDEO" ? (
                    <img
                      src={cover.url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                      No photo
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm font-bold text-leaf-700">{item.price}</p>
                  <p className="truncate text-xs text-slate-500">{item.condition}</p>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="card p-4 text-sm text-slate-600">
          No products in this filter. Click <strong>Sell a product</strong> to create a listing.
        </section>
      )}

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="max-h-[90vh] w-[min(880px,96vw)] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: selectedItem.sellerUserId }))
                  }
                  className="shrink-0"
                >
                  <img
                    src={selectedItem.sellerPhotoUrl || defaultAvatar}
                    alt={`${selectedItem.sellerName} profile`}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: selectedItem.sellerUserId }))
                    }
                    className="feed-author-name text-left text-slate-900 transition hover:text-leaf-700"
                  >
                    {selectedItem.sellerName}
                  </button>
                  <p className="feed-meta mt-1 text-slate-500">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {selectedItem.media.length > 0 ? (
              <MediaCarousel media={selectedItem.media} />
            ) : (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No media attached
              </div>
            )}

            <div className="mt-4 grid gap-3 text-slate-700">
              <p className="feed-author-name text-leaf-700">{formatPrice(selectedItem.price)}</p>
              <p>
                <span className="feed-meta text-slate-900">Condition:</span>{" "}
                <span className="feed-post-copy">{selectedItem.condition}</span>
              </p>
            </div>
            <p className="feed-post-copy mt-3 text-slate-700">{selectedItem.description || "No description provided."}</p>

            {selectedItem.sellerUserId === meQuery.data?.id ? (
              <p className="mt-4 text-xs text-slate-500">This is your listing.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {sellOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSellOpen(false)}
        >
          <form
            onSubmit={onCreateProduct}
            className="w-[min(760px,96vw)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Sell a product</h3>
              <button
                type="button"
                onClick={() => setSellOpen(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-slate-600">Product title</span>
                <input
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Price</span>
                <input
                  value={formPrice}
                  onChange={(event) => setFormPrice(event.target.value)}
                  placeholder="$120"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Condition</span>
                <select
                  value={formCondition}
                  onChange={(event) => setFormCondition(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
                >
                  <option>Used - Like New</option>
                  <option>Used - Excellent</option>
                  <option>Used - Good</option>
                  <option>Used - Fair</option>
                  <option>New</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Category</span>
                <select
                  value={formCategory}
                  onChange={(event) => setFormCategory(event.target.value as GarageSaleCategory)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
                >
                  {GARAGE_SALE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-slate-600">Description</span>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-slate-600">Photos / Videos</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onMediaSelected}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {formMedia.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">{formMedia.length} media item(s) uploaded</p>
                ) : null}
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSellOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createItemMutation.isPending}
                className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
              >
                Publish listing
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
