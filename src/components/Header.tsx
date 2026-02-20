"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Clock, Crown } from "lucide-react";
import { useSearchDramas } from "@/hooks/useDramas";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useFlickReelsSearch } from "@/hooks/useFlickReels";
import { useFreeReelsSearch } from "@/hooks/useFreeReels";
import { usePlatform } from "@/hooks/usePlatform";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const normalizedQuery = debouncedQuery.trim();

  const { isDramaBox, isReelShort, isNetShort, isMelolo, isFlickReels, isFreeReels, platformInfo } = usePlatform();

  const { data: dramaBoxResults, isLoading: isSearchingDramaBox } = useSearchDramas(
    isDramaBox ? normalizedQuery : ""
  );
  const { data: reelShortResults, isLoading: isSearchingReelShort } = useReelShortSearch(
    isReelShort ? normalizedQuery : ""
  );
  const { data: netShortResults, isLoading: isSearchingNetShort } = useNetShortSearch(
    isNetShort ? normalizedQuery : ""
  );
  const { data: meloloResults, isLoading: isSearchingMelolo } = useMeloloSearch(
    isMelolo ? normalizedQuery : ""
  );
  const { data: flickReelsResults, isLoading: isSearchingFlickReels } = useFlickReelsSearch(
    isFlickReels ? normalizedQuery : ""
  );
  const { data: freeReelsResults, isLoading: isSearchingFreeReels } = useFreeReelsSearch(
    isFreeReels ? normalizedQuery : ""
  );

  const isSearching = isDramaBox 
    ? isSearchingDramaBox 
    : isReelShort 
      ? isSearchingReelShort 
      : isNetShort 
        ? isSearchingNetShort
        : isMelolo
          ? isSearchingMelolo
          : isFlickReels
            ? isSearchingFlickReels
            : isSearchingFreeReels;

  const searchResults = isDramaBox 
    ? dramaBoxResults 
    : isReelShort 
      ? reelShortResults?.data 
      : isNetShort
        ? netShortResults?.data
        : isMelolo
          ? meloloResults?.data?.search_data?.flatMap((item: any) => item.books || [])
              .filter((book: any) => book.thumb_url && book.thumb_url !== "") || []
          : isFlickReels
            ? flickReelsResults?.data
            : freeReelsResults;

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src="/logo.png"
                alt="CTRXL Drama"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 32px, 36px"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-foreground leading-tight">
                CTRXL Drama
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">
                Streaming Platform
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link href="/chat" className={`nav-item ${pathname === '/chat' ? 'active' : ''}`}>
              Chat
            </Link>
            <Link href="/favorites" className={`nav-item ${pathname === '/favorites' ? 'active' : ''}`}>
              Library
            </Link>
            <Link href="/upgrade" className={`nav-item ${pathname === '/upgrade' ? 'active' : ''} flex items-center gap-1.5`}>
              <Crown className="w-4 h-4 text-amber-400" />
              VIP
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-icon"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            
            <Link href="/history" className="btn-icon">
              <Clock className="w-[18px] h-[18px]" />
            </Link>
            
            <NotificationBell />
          </div>
        </div>
      </div>

      {searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-background z-[9999] overflow-hidden">
            <div className="container-main py-4 h-[100dvh] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${platformInfo.name}...`}
                    className="input-base pl-12 h-12"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="btn-icon h-12 w-12"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <span className="text-label">Searching in</span>
                <span className="badge-count">{platformInfo.name}</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                {isSearching && normalizedQuery && (
                  <div className="flex items-center justify-center py-20">
                    <div className="loading-spinner" />
                  </div>
                )}

                {!isSearching && normalizedQuery && searchResults && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Search className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No results found for "{normalizedQuery}"</p>
                  </div>
                )}

                {isDramaBox && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((drama: any) => (
                      <Link
                        key={drama.bookId}
                        href={`/detail/dramabox/${drama.bookId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={drama.cover}
                          alt={drama.bookName}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{drama.bookName}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{drama.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isReelShort && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((book: any) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/reelshort/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={book.cover_url}
                          alt={book.name}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{book.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{book.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isNetShort && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((item: any) => (
                      <Link
                        key={item.short_play_id}
                        href={`/detail/netshort/${item.short_play_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{item.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isMelolo && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((book: any) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/melolo/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={book.thumb_url}
                          alt={book.book_name}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{book.book_name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{book.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isFlickReels && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((book: any) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/flickreels/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={book.cover_url}
                          alt={book.name}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{book.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{book.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isFreeReels && searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((book: any) => (
                      <Link
                        key={book.bookId}
                        href={`/detail/freereels/${book.bookId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-3 rounded-xl hover:bg-card transition-all"
                      >
                        <img
                          src={book.cover}
                          alt={book.bookName}
                          className="w-16 h-24 object-cover flex-shrink-0 rounded-lg"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">{book.bookName}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{book.introduction}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
