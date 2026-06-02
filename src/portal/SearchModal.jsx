import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { api } from "./api";
import styles from "./SearchModal.module.css";

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
        setSearched(true);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleResultClick = (result) => {
    const basePath = isAdmin ? "/admin/tasks" : "/portal/tasks";
    navigate(`${basePath}/${result.id}`);
    onClose();
  };

  const buildSubtext = (result) => {
    const parts = [];
    if (result.service_type) parts.push(result.service_type);
    if (isAdmin && result.client_name) parts.push(result.client_name);
    if (result.status) parts.push(result.status);
    return parts.join(" · ");
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className={styles.box}>
        <div className={styles.inputWrap}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.hint}>ESC to close</span>
        </div>

        {(results.length > 0 || (searched && query.length >= 2)) && (
          <div className={styles.results}>
            {results.length === 0 ? (
              <div className={styles.empty}>
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className={styles.resultItem}
                  onClick={() => handleResultClick(result)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleResultClick(result);
                    }
                  }}
                >
                  <div className={styles.resultInfo}>
                    <strong>{result.title}</strong>
                    <span>{buildSubtext(result)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  );
}
