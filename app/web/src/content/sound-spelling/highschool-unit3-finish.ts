import type {SoundSpellingLesson} from './types';

export const highschoolUnit3Finish: SoundSpellingLesson[] = [
  {
    "headword": "error",
    "ipa": "/ˈerər/",
    "uk": "/ˈerə/",
    "chunks": [
      {
        "letters": "e",
        "sound": "/e/",
        "stress": "primary",
        "hint": "首元音重读。",
        "pairs": [
          {
            "letters": "e",
            "sound": "/e/"
          }
        ],
        "tip": "首元音重读。"
      },
      {
        "letters": "rror",
        "sound": "/rər/",
        "stress": "none",
        "hint": "双 r 对应一个 /r/，美式词尾读 /ər/。",
        "pairs": [
          {
            "letters": "rr",
            "sound": "/r/"
          },
          {
            "letters": "o",
            "sound": "/ə/"
          },
          {
            "letters": "r",
            "sound": "/r/"
          }
        ],
        "tip": "双 r 对应一个 /r/，美式词尾读 /ər/。"
      }
    ],
    "anchor": {
      "text": "注意双 r 与轻读词尾。"
    },
    "variantNote": "英式词尾 r 通常不单独发音。",
    "sources": [
      {
        "label": "Cambridge Dictionary · 英语词条",
        "url": "https://dictionary.cambridge.org/dictionary/english/error"
      }
    ],
    "review": {
      "status": "reviewed",
      "reviewedAt": "2026-10-28",
      "draftedBy": "Codex phoneme/letter alignment"
    }
  }
];
