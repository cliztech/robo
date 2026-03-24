import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StudioStage } from "@/components/gear/StudioStage";

describe("StudioStage", () => {
  it("renders the stage with default layout name", () => {
    render(<StudioStage />);
    const input = screen.getByLabelText("Layout name") as HTMLInputElement;
    expect(input.value).toBe("My Setup");
  });

  it("renders gear palette with all gear types", () => {
    render(<StudioStage />);
    expect(screen.getByText("Platinum CDJ")).toBeInTheDocument();
    expect(screen.getByText("Vintage Mixer")).toBeInTheDocument();
    expect(screen.getByText("Cyber Turntable")).toBeInTheDocument();
  });

  it("renders empty hint when no gear is placed", () => {
    render(<StudioStage />);
    expect(
      screen.getByText("Drag gear from the palette to build your setup"),
    ).toBeInTheDocument();
  });

  it("export button is present", () => {
    render(<StudioStage />);
    expect(screen.getByText(/Export/)).toBeInTheDocument();
  });

  it("clear button is present", () => {
    render(<StudioStage />);
    expect(screen.getByText(/Clear/)).toBeInTheDocument();
  });

  it("layout name can be changed", () => {
    render(<StudioStage />);
    const input = screen.getByLabelText("Layout name") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Club Setup" } });
    expect(input.value).toBe("Club Setup");
  });

  it("displays GEAR palette title", () => {
    render(<StudioStage />);
    expect(screen.getByText("GEAR")).toBeInTheDocument();
  });
});
