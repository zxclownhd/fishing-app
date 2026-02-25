import LocationCard from "../LocationCard";
import EditLocationForm from "./EditLocationForm";

export default function MyLocationsList({
  items,
  loading,
  error,
  page,
  total,
  totalPages,
  onPrev,
  onNext,
  onRefresh,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleHidden,
}) {
  return (
    <div style={{ marginTop: 12 }}>
      {error ? (
        <div style={styles.error}>
          <div>{error}</div>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading && !error && items.length === 0 ? (
        <div style={styles.empty}>No locations yet</div>
      ) : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((loc) => {
          const isEditing = editingId === loc.id;

          const fishChips = (loc.fish || []).slice(0, 8).map((x, idx) => (
            <span
              key={
                x.fishId
                  ? `${loc.id}-fish-${x.fishId}`
                  : `${loc.id}-fish-${idx}`
              }
              style={styles.chip}
            >
              {x.fish?.name || "fish"}
            </span>
          ));

          const seasonChips = (loc.seasons || []).slice(0, 8).map((x, idx) => (
            <span
              key={
                x.seasonId
                  ? `${loc.id}-season-${x.seasonId}`
                  : `${loc.id}-season-${idx}`
              }
              style={styles.chip}
            >
              {x.season?.code || x.season?.name || "season"}
            </span>
          ));

          return (
            <LocationCard
              key={loc.id}
              loc={loc}
              variant="admin"
              footer={
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {fishChips}
                    {seasonChips}
                  </div>

                  {isEditing ? (
                    <div style={styles.editBox}>
                      <EditLocationForm
                        loc={loc}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                      />
                    </div>
                  ) : null}
                </div>
              }
              actions={
                <>
                  <button onClick={() => onStartEdit(loc)} disabled={loading}>
                    {isEditing ? "Editing" : "Edit"}
                  </button>

                  <button
                    onClick={() => onToggleHidden(loc)}
                    disabled={loading}
                  >
                    {loc.status === "HIDDEN" ? "Unhide" : "Hide"}
                  </button>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      disabled={loading}
                    >
                      Close edit
                    </button>
                  ) : null}
                </>
              }
            />
          );
        })}
      </div>

      <div style={styles.pagination}>
        <button onClick={onPrev} disabled={loading || page === 1}>
          Prev
        </button>

        <div style={{ opacity: 0.8 }}>
          Page {page} / {totalPages} | Total {total}
        </div>

        <button onClick={onNext} disabled={loading || page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  chip: {
    fontSize: 12,
    padding: "2px 8px",
    border: "1px solid #eee",
    borderRadius: 999,
  },
  editBox: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  empty: { padding: 12, opacity: 0.75 },
  error: {
    marginTop: 12,
    padding: 12,
    border: "1px solid #f2b5b5",
    background: "#fff0f0",
    borderRadius: 12,
  },
};
