"""Video format presets: resolution, caption positions and safe zones (section 5.10)."""

from __future__ import annotations

import json
from functools import lru_cache

from pydantic import BaseModel, Field

from .. import config
from ..errors import NarraReelError


class FormatError(NarraReelError):
    """Unknown or invalid format preset."""


class VideoFormat(BaseModel):
    id: str
    name: str
    width: int | None = None  # None for audio-only
    height: int | None = None
    fps: int = 30
    positions: dict[str, float] = Field(default_factory=dict)  # fraction of frame height
    max_text_width: float = 0.84  # fraction of frame width available to caption text
    safe_zone: dict[str, float] = Field(default_factory=dict)
    default_style: str = "bold-pop"
    note: str = ""

    @property
    def is_video(self) -> bool:
        return bool(self.width and self.height)

    def position_y(self, position: str, offset: int = 0) -> int:
        if not self.is_video:
            raise FormatError("Audio-only exports have no caption position.")
        frac = self.positions.get(position, 0.62)
        return round(self.height * frac) + offset  # type: ignore[operator]


@lru_cache(maxsize=1)
def _all() -> dict[str, VideoFormat]:
    out: dict[str, VideoFormat] = {}
    for path in sorted((config.presets_dir() / "formats").glob("*.json")):
        try:
            fmt = VideoFormat.model_validate(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, ValueError) as exc:
            raise FormatError(f"Format preset {path.name} is invalid: {exc}") from exc
        out[fmt.id] = fmt
    return out


def list_formats() -> list[VideoFormat]:
    return list(_all().values())


def get_format(format_id: str) -> VideoFormat:
    try:
        return _all()[format_id].model_copy(deep=True)
    except KeyError:
        raise FormatError(
            f"Unknown format '{format_id}'. Available: {', '.join(_all())}."
        ) from None
