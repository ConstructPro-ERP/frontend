import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useModalFocusTrap } from "@/components/dashboard/quotations/useModalFocusTrap";
function Dialog({
  open = true,
  busy = false,
  close,
}: {
  open?: boolean;
  busy?: boolean;
  close: () => void;
}) {
  const ref = useModalFocusTrap(open, close, busy);
  return (
    <div ref={ref}>
      <button>First</button>
      <input aria-label="Input" />
      <button>Last</button>
    </div>
  );
}
it("focuses the editable field, traps both tab directions, and honors busy Escape", async () => {
  const close = vi.fn();
  const view = render(<Dialog close={close} />);
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText("Input")),
  );
  screen.getByRole("button", { name: "Last" }).focus();
  fireEvent.keyDown(window, { key: "Tab" });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "First" }),
  );
  fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Last" }),
  );
  fireEvent.keyDown(window, { key: "a" });
  fireEvent.keyDown(window, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(<Dialog close={close} busy />);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(<Dialog close={close} open={false} />);
});
it("does not steal focus after the user starts interacting", async () => {
  render(<Dialog close={vi.fn()} />);
  screen.getByRole("button", { name: "Last" }).focus();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Last" }),
  );
});
