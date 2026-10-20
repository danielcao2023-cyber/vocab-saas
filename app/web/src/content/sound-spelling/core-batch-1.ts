import type {SoundSpellingLesson} from './types';

/** First 30 core words: reviewed maps; raw model output is never loaded by the app. */
export const coreBatch1 = [
 {
  "headword": "important",
  "ipa": "/ɪmˈpɔːrtənt/",
  "chunks": [
   {
    "letters": "im",
    "sound": "/ɪm/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "m",
      "sound": "/m/"
     }
    ],
    "tip": "i 对应短音 /ɪ/，把开头 im 写全。"
   },
   {
    "letters": "por",
    "sound": "/pɔːr/",
    "stress": "primary",
    "hint": "or 整体对应 /ɔːr/",
    "pairs": [
     {
      "letters": "p",
      "sound": "/p/"
     },
     {
      "letters": "or",
      "sound": "/ɔːr/"
     }
    ],
    "tip": "重音在这里，or 对应 /ɔːr/，前面的 /p/ 对应 p。"
   },
   {
    "letters": "tant",
    "sound": "/tənt/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t/"
     },
     {
      "letters": "a",
      "sound": "/ə/"
     },
     {
      "letters": "n",
      "sound": "/n/"
     },
     {
      "letters": "t",
      "sound": "/t/"
     }
    ],
    "tip": "a 在这里弱读 /ə/，仍要写 a，不要写成 e。"
   }
  ],
  "anchor": {
   "text": "重读 por 中 or 对应 /ɔːr/；末尾 tant 的 a 弱读 /ə/，仍要写 a。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "remember",
  "ipa": "/rɪˈmembər/",
  "chunks": [
   {
    "letters": "re",
    "sound": "/rɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 在这个词里读短音 /ɪ/。"
   },
   {
    "letters": "mem",
    "sound": "/mem/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "m",
      "sound": "/m/"
     },
     {
      "letters": "e",
      "sound": "/e/"
     },
     {
      "letters": "m",
      "sound": "/m/"
     }
    ],
    "tip": "重读部分是 mem，注意前后各有一个 m。"
   },
   {
    "letters": "ber",
    "sound": "/bər/",
    "stress": "none",
    "hint": "er 整体对应 /ər/",
    "pairs": [
     {
      "letters": "b",
      "sound": "/b/"
     },
     {
      "letters": "er",
      "sound": "/ər/"
     }
    ],
    "tip": "b 确实发 /b/，er 对应美式卷舌弱元音 /ər/。"
   }
  ],
  "anchor": {
   "text": "mem 前后各有一个 m；后面 ber 的 b 发 /b/，不要漏写。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/pronunciation/english/remember"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "information",
  "ipa": "/ˌɪnfərˈmeɪʃən/",
  "chunks": [
   {
    "letters": "in",
    "sound": "/ɪn/",
    "stress": "secondary",
    "hint": "这里有次重音",
    "pairs": [
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "n",
      "sound": "/n/"
     }
    ],
    "tip": "开头有次重音，i 对应 /ɪ/。"
   },
   {
    "letters": "for",
    "sound": "/fər/",
    "stress": "none",
    "hint": "or 整体对应 /ər/",
    "pairs": [
     {
      "letters": "f",
      "sound": "/f/"
     },
     {
      "letters": "or",
      "sound": "/ər/"
     }
    ],
    "tip": "or 在这个词里弱读 /ər/，不是重读的 /ɔːr/。"
   },
   {
    "letters": "ma",
    "sound": "/meɪ/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "m",
      "sound": "/m/"
     },
     {
      "letters": "a",
      "sound": "/eɪ/"
     }
    ],
    "tip": "主重音在 ma，a 对应双元音 /eɪ/。"
   },
   {
    "letters": "tion",
    "sound": "/ʃən/",
    "stress": "none",
    "hint": "tion 整体对应 /ʃən/",
    "pairs": [
     {
      "letters": "tion",
      "sound": "/ʃən/"
     }
    ],
    "tip": "把 tion 和 /ʃən/ 作为一组记，不按字母名逐个读。"
   }
  ],
  "anchor": {
   "text": "主重音在 ma；for 中 or 弱读 /ər/，结尾 tion 整体对应 /ʃən/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/us/dictionary/english/information"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "education",
  "ipa": "/ˌedʒ.əˈkeɪ.ʃən/",
  "chunks": [
   {
    "letters": "ed",
    "sound": "/edʒ/",
    "stress": "secondary",
    "hint": "这里有次重音",
    "pairs": [
     {
      "letters": "e",
      "sound": "/e/"
     },
     {
      "letters": "d",
      "sound": "/dʒ/"
     }
    ],
    "tip": "本词这个美式读法中，d 与后面的 u 连读时对应 /dʒ/。"
   },
   {
    "letters": "u",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "u",
      "sound": "/ə/"
     }
    ],
    "tip": "这里的 u 弱读 /ə/，不是字母名 /juː/。"
   },
   {
    "letters": "ca",
    "sound": "/keɪ/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "c",
      "sound": "/k/"
     },
     {
      "letters": "a",
      "sound": "/eɪ/"
     }
    ],
    "tip": "主重音在 ca，c 对应 /k/，a 对应 /eɪ/。"
   },
   {
    "letters": "tion",
    "sound": "/ʃən/",
    "stress": "none",
    "hint": "tion 整体对应 /ʃən/",
    "pairs": [
     {
      "letters": "tion",
      "sound": "/ʃən/"
     }
    ],
    "tip": "结尾 tion 整体对应 /ʃən/，拼写四个字母都要保留。"
   }
  ],
  "anchor": {
   "text": "u 在这个美式读法中弱读 /ə/，但拼写仍是 u；结尾写全 tion。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/pronunciation/english/education"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "这里采用 /ˌedʒəˈkeɪʃən/ 的美式读法；也有保留 /j/、u 对应 /ʊ/ 或 /u/ 的读法。拼写始终是 education，不按单个变体增删字母。"
 },
 {
  "headword": "different",
  "ipa": "/ˈdɪfərənt/",
  "chunks": [
   {
    "letters": "diff",
    "sound": "/dɪf/",
    "stress": "primary",
    "hint": "ff 整体对应 /f/",
    "pairs": [
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "ff",
      "sound": "/f/"
     }
    ],
    "tip": "ff 对应一个 /f/，虽然只听到一个音，拼写要写两个 f。"
   },
   {
    "letters": "er",
    "sound": "/ər/",
    "stress": "none",
    "hint": "er 整体对应 /ər/",
    "pairs": [
     {
      "letters": "er",
      "sound": "/ər/"
     }
    ],
    "tip": "这里展示完整读法中的 /ər/，快读时这个弱元音可能省略。"
   },
   {
    "letters": "ent",
    "sound": "/ənt/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "e",
      "sound": "/ə/"
     },
     {
      "letters": "n",
      "sound": "/n/"
     },
     {
      "letters": "t",
      "sound": "/t/"
     }
    ],
    "tip": "结尾 e 弱读 /ə/，写 ent 而不是 ant。"
   }
  ],
  "anchor": {
   "text": "ff 对应一个 /f/，拼写要两个 f；结尾写 ent，不是 ant。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/pronunciation/english/different"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "这里按三个音节的完整读法对照。常见快读也有 /ˈdɪfrənt/，弱元音可以省略，但 different 的两个 f 和所有字母都要保留。"
 },
 {
  "headword": "together",
  "ipa": "/təˈɡeðər/",
  "chunks": [
   {
    "letters": "to",
    "sound": "/tə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t/"
     },
     {
      "letters": "o",
      "sound": "/ə/"
     }
    ],
    "tip": "开头 o 在这里弱读 /ə/，不要按字母名读。"
   },
   {
    "letters": "ge",
    "sound": "/ɡe/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "g",
      "sound": "/ɡ/"
     },
     {
      "letters": "e",
      "sound": "/e/"
     }
    ],
    "tip": "这里 g 对应 /ɡ/，e 对应 /e/，这一段重读。"
   },
   {
    "letters": "ther",
    "sound": "/ðər/",
    "stress": "none",
    "hint": "th 整体对应 /ð/",
    "pairs": [
     {
      "letters": "th",
      "sound": "/ð/"
     },
     {
      "letters": "er",
      "sound": "/ər/"
     }
    ],
    "tip": "th 合在一起读浊音 /ð/，er 对应 /ər/。"
   }
  ],
  "anchor": {
   "text": "to开头o弱读，ge重读g发/g/，ther中th读/ð/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "another",
  "ipa": "/əˈnʌð.ɚ/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "第一个 a 轻短地读 /ə/，与后面的重读部分分开记。"
   },
   {
    "letters": "no",
    "sound": "/nʌ/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "n",
      "sound": "/n/"
     },
     {
      "letters": "o",
      "sound": "/ʌ/"
     }
    ],
    "tip": "o 在本词里对应 /ʌ/，不是字母名 /oʊ/。"
   },
   {
    "letters": "ther",
    "sound": "/ðɚ/",
    "stress": "none",
    "hint": "th 整体对应 /ð/",
    "pairs": [
     {
      "letters": "th",
      "sound": "/ð/"
     },
     {
      "letters": "er",
      "sound": "/ɚ/"
     }
    ],
    "tip": "th 对应 /ð/，er 对应 /ɚ/，也常写作 /ər/。"
   }
  ],
  "anchor": {
   "text": "a首轻读/ə/，no里o发/ʌ/，ther中th读/ð/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "believe",
  "ipa": "/bɪˈliːv/",
  "chunks": [
   {
    "letters": "be",
    "sound": "/bɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "b",
      "sound": "/b/"
     },
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 be 在这里轻读 /bɪ/，不要读成独立词 be 的 /biː/。"
   },
   {
    "letters": "lieve",
    "sound": "/liːv/",
    "stress": "primary",
    "hint": "e 不单独发音",
    "pairs": [
     {
      "letters": "l",
      "sound": "/l/"
     },
     {
      "letters": "ie",
      "sound": "/iː/"
     },
     {
      "letters": "v",
      "sound": "/v/"
     },
     {
      "letters": "e",
      "sound": ""
     }
    ],
    "tip": "ie 合起来对应 /iː/，末尾 e 不单独发音，但拼写不能漏。"
   }
  ],
  "anchor": {
   "text": "be开头轻读/bɪ/，lieve里ie发/iː/，末尾e不发音要保留。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "become",
  "ipa": "/bɪˈkʌm/",
  "chunks": [
   {
    "letters": "be",
    "sound": "/bɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "b",
      "sound": "/b/"
     },
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 在这里对应短音 /ɪ/。"
   },
   {
    "letters": "come",
    "sound": "/kʌm/",
    "stress": "primary",
    "hint": "e 不单独发音",
    "pairs": [
     {
      "letters": "c",
      "sound": "/k/"
     },
     {
      "letters": "o",
      "sound": "/ʌ/"
     },
     {
      "letters": "m",
      "sound": "/m/"
     },
     {
      "letters": "e",
      "sound": ""
     }
    ],
    "tip": "come 中 o 对应 /ʌ/，末尾 e 不单独发音，仍要保留。"
   }
  ],
  "anchor": {
   "text": "be开头e读短音，come中o发/ʌ/，末尾e不发音要保留。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "decide",
  "ipa": "/dɪˈsaɪd/",
  "chunks": [
   {
    "letters": "de",
    "sound": "/dɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 对应短音 /ɪ/，不要读字母名。"
   },
   {
    "letters": "cide",
    "sound": "/saɪd/",
    "stress": "primary",
    "hint": "e 不单独发音",
    "pairs": [
     {
      "letters": "c",
      "sound": "/s/"
     },
     {
      "letters": "i",
      "sound": "/aɪ/"
     },
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "e",
      "sound": ""
     }
    ],
    "tip": "这里 c 对应 /s/，i 对应 /aɪ/，末尾 e 不单独发音。"
   }
  ],
  "anchor": {
   "text": "de开头e读短音，cide里c发/s/，i发/aɪ/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "develop",
  "ipa": "/dɪˈveləp/",
  "chunks": [
   {
    "letters": "de",
    "sound": "/dɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 对应 /ɪ/，不是不发音。"
   },
   {
    "letters": "ve",
    "sound": "/ve/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "v",
      "sound": "/v/"
     },
     {
      "letters": "e",
      "sound": "/e/"
     }
    ],
    "tip": "重读元音 /e/ 对应这个 e，注意 /v/ 不要读成 /w/。"
   },
   {
    "letters": "lop",
    "sound": "/ləp/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "l",
      "sound": "/l/"
     },
     {
      "letters": "o",
      "sound": "/ə/"
     },
     {
      "letters": "p",
      "sound": "/p/"
     }
    ],
    "tip": "最后的 o 弱读 /ə/，但拼写仍是 lop，不是 lep。"
   }
  ],
  "anchor": {
   "text": "开头 e 读 /ɪ/；结尾 o 弱读 /ə/，拼写仍是 lop。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "discover",
  "ipa": "/dɪˈskʌvər/",
  "chunks": [
   {
    "letters": "dis",
    "sound": "/dɪs/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "s",
      "sound": "/s/"
     }
    ],
    "tip": "按 d、i、s 对应 /dɪs/，这里没有多出的 /k/。"
   },
   {
    "letters": "cov",
    "sound": "/kʌv/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "c",
      "sound": "/k/"
     },
     {
      "letters": "o",
      "sound": "/ʌ/"
     },
     {
      "letters": "v",
      "sound": "/v/"
     }
    ],
    "tip": "重读部分 cov 中，c 对应 /k/，o 对应 /ʌ/。"
   },
   {
    "letters": "er",
    "sound": "/ər/",
    "stress": "none",
    "hint": "er 整体对应 /ər/",
    "pairs": [
     {
      "letters": "er",
      "sound": "/ər/"
     }
    ],
    "tip": "美式结尾 er 对应卷舌弱元音 /ər/。"
   }
  ],
  "anchor": {
   "text": "/k/ 对应 cov 中的 c；结尾卷舌弱元音 /ər/ 对应 er。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "arrive",
  "ipa": "/əˈraɪv/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "首字母 a 弱读 /ə/，不要额外添一个 /r/。"
   },
   {
    "letters": "rrive",
    "sound": "/raɪv/",
    "stress": "primary",
    "hint": "e 不单独发音",
    "pairs": [
     {
      "letters": "rr",
      "sound": "/r/"
     },
     {
      "letters": "i",
      "sound": "/aɪ/"
     },
     {
      "letters": "v",
      "sound": "/v/"
     },
     {
      "letters": "e",
      "sound": ""
     }
    ],
    "tip": "rr 对应一个 /r/，拼写却要两个 r；末尾 e 不单独发音。"
   }
  ],
  "anchor": {
   "text": "a弱读/ə/勿添/r/，rr只发一个/r/但拼写双r，e不单独发音。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "across",
  "ipa": "/əˈkrɔːs/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "开头 a 弱读 /ə/，重音在后面。"
   },
   {
    "letters": "cross",
    "sound": "/krɔːs/",
    "stress": "primary",
    "hint": "ss 整体对应 /s/",
    "pairs": [
     {
      "letters": "c",
      "sound": "/k/"
     },
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "o",
      "sound": "/ɔː/"
     },
     {
      "letters": "ss",
      "sound": "/s/"
     }
    ],
    "tip": "ss 对应一个 /s/，不是把声音拉长；拼写仍要两个 s。"
   }
  ],
  "anchor": {
   "text": "a弱读/ə/重音后移，cross中ss只发一个/s/但拼写双s。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "around",
  "ipa": "/əˈraʊnd/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "开头 a 在这里轻短地读 /ə/。"
   },
   {
    "letters": "round",
    "sound": "/raʊnd/",
    "stress": "primary",
    "hint": "ou 整体对应 /aʊ/",
    "pairs": [
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "ou",
      "sound": "/aʊ/"
     },
     {
      "letters": "n",
      "sound": "/n/"
     },
     {
      "letters": "d",
      "sound": "/d/"
     }
    ],
    "tip": "ou 对应双元音 /aʊ/，结尾 n 和 d 都要写出来。"
   }
  ],
  "anchor": {
   "text": "a轻读/ə/，round中ou发双元音/aʊ/，n和d都要写出。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "agree",
  "ipa": "/əˈɡriː/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "开头 a 弱读 /ə/，不是不发音。"
   },
   {
    "letters": "gree",
    "sound": "/ɡriː/",
    "stress": "primary",
    "hint": "ee 整体对应 /iː/",
    "pairs": [
     {
      "letters": "g",
      "sound": "/ɡ/"
     },
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "ee",
      "sound": "/iː/"
     }
    ],
    "tip": "ee 合起来对应长音 /iː/，不要误写成 ea。"
   }
  ],
  "anchor": {
   "text": "a弱读/ə/非不发音，gree中ee发长音/iː/，勿误作ea。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "although",
  "ipa": "/ɔːlˈðoʊ/",
  "chunks": [
   {
    "letters": "al",
    "sound": "/ɔːl/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ɔː/"
     },
     {
      "letters": "l",
      "sound": "/l/"
     }
    ],
    "tip": "这里 a 对应 /ɔː/，后面的 l 仍要读、仍要写。"
   },
   {
    "letters": "though",
    "sound": "/ðoʊ/",
    "stress": "primary",
    "hint": "gh 不单独发音",
    "pairs": [
     {
      "letters": "th",
      "sound": "/ð/"
     },
     {
      "letters": "ou",
      "sound": "/oʊ/"
     },
     {
      "letters": "gh",
      "sound": ""
     }
    ],
    "tip": "th 对应浊音 /ð/，ou 对应 /oʊ/，gh 在本词中不单独发音。"
   }
  ],
  "anchor": {
   "text": "al中a读/ɔː/、l仍读写，though中th读/ð/、ou读/oʊ/、gh不发音。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "attention",
  "ipa": "/əˈtenʃən/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "首字母 a 弱读 /ə/，重音在下一段。"
   },
   {
    "letters": "tten",
    "sound": "/ten/",
    "stress": "primary",
    "hint": "tt 整体对应 /t/",
    "pairs": [
     {
      "letters": "tt",
      "sound": "/t/"
     },
     {
      "letters": "e",
      "sound": "/e/"
     },
     {
      "letters": "n",
      "sound": "/n/"
     }
    ],
    "tip": "两个 t 对应一个 /t/，拼写不要少写一个 t。"
   },
   {
    "letters": "tion",
    "sound": "/ʃən/",
    "stress": "none",
    "hint": "tion 整体对应 /ʃən/",
    "pairs": [
     {
      "letters": "tion",
      "sound": "/ʃən/"
     }
    ],
    "tip": "结尾 tion 整体对应 /ʃən/，不要逐字母读。"
   }
  ],
  "anchor": {
   "text": "a弱读/ə/重音在tten，两个t只发一个/t/但拼写双t，tion整体读/ʃən/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "example",
  "ipa": "/ɪɡˈzæm.pəl/",
  "chunks": [
   {
    "letters": "e",
    "sound": "/ɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 对应短音 /ɪ/。"
   },
   {
    "letters": "xam",
    "sound": "/ɡzæm/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "x",
      "sound": "/ɡz/"
     },
     {
      "letters": "a",
      "sound": "/æ/"
     },
     {
      "letters": "m",
      "sound": "/m/"
     }
    ],
    "tip": "这里 x 对应两个辅音 /ɡz/，/z/ 也来自 x，重读元音 /æ/ 对应 a。"
   },
   {
    "letters": "ple",
    "sound": "/pəl/",
    "stress": "none",
    "hint": "le 整体对应 /əl/",
    "pairs": [
     {
      "letters": "p",
      "sound": "/p/"
     },
     {
      "letters": "le",
      "sound": "/əl/"
     }
    ],
    "tip": "结尾 le 在这里整体对应 /əl/，不要漏掉末尾 e。"
   }
  ],
  "anchor": {
   "text": "e开头读/ɪ/，xam中x读/ɡz/、a读/æ/，ple中le整体读/əl/勿漏e。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "x 整体对应 /ɡz/，这两个音可跨越发音音节边界；把 xam 放在同一记忆分段只是为了完整对齐字母，重读元音是 a 对应的 /æ/。"
 },
 {
  "headword": "enough",
  "ipa": "/ɪˈnʌf/",
  "chunks": [
   {
    "letters": "e",
    "sound": "/ɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "e",
      "sound": "/ɪ/"
     }
    ],
    "tip": "开头 e 对应 /ɪ/，重音在后面。"
   },
   {
    "letters": "nough",
    "sound": "/nʌf/",
    "stress": "primary",
    "hint": "ou 整体对应 /ʌ/",
    "pairs": [
     {
      "letters": "n",
      "sound": "/n/"
     },
     {
      "letters": "ou",
      "sound": "/ʌ/"
     },
     {
      "letters": "gh",
      "sound": "/f/"
     }
    ],
    "tip": "这个词里 ou 对应 /ʌ/，gh 对应 /f/，gh 不是不发音。"
   }
  ],
  "anchor": {
   "text": "e开头读/ɪ/重音后移，nough中ou读/ʌ/、gh读/f/非不发音。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "ability",
  "ipa": "/əˈbɪləti/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "首字母 a 轻短地读 /ə/。"
   },
   {
    "letters": "bi",
    "sound": "/bɪ/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "b",
      "sound": "/b/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     }
    ],
    "tip": "重音在这里，i 对应短音 /ɪ/，不是 /aɪ/。"
   },
   {
    "letters": "li",
    "sound": "/lə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "l",
      "sound": "/l/"
     },
     {
      "letters": "i",
      "sound": "/ə/"
     }
    ],
    "tip": "后一个 i 在这里弱读 /ə/，不要改写成 e。"
   },
   {
    "letters": "ty",
    "sound": "/ti/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t/"
     },
     {
      "letters": "y",
      "sound": "/i/"
     }
    ],
    "tip": "末尾 y 对应 /i/，美式录音中 t 可能轻拍，拼写仍是 ty。"
   }
  ],
  "anchor": {
   "text": "两个 i 在这里分别读 /ɪ/、/ə/，结尾 /i/ 对应 y。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "这里用 /t/ 表示词中的基本辅音，美式自然录音里 t 常轻拍，听起来更轻；不能因此把 t 改写成 d。"
 },
 {
  "headword": "action",
  "ipa": "/ˈækʃən/",
  "chunks": [
   {
    "letters": "ac",
    "sound": "/æk/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "a",
      "sound": "/æ/"
     },
     {
      "letters": "c",
      "sound": "/k/"
     }
    ],
    "tip": "开头 ac 对应 /æk/，c 对应 /k/。"
   },
   {
    "letters": "tion",
    "sound": "/ʃən/",
    "stress": "none",
    "hint": "tion 整体对应 /ʃən/",
    "pairs": [
     {
      "letters": "tion",
      "sound": "/ʃən/"
     }
    ],
    "tip": "tion 整体对应 /ʃən/，不是把 t、i、o、n 按字母名连读。"
   }
  ],
  "anchor": {
   "text": "开头ac读/æk/，tion整体读/ʃən/，不要拆开按字母名连读。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "activity",
  "ipa": "/ækˈtɪvəti/",
  "chunks": [
   {
    "letters": "ac",
    "sound": "/æk/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "a",
      "sound": "/æ/"
     },
     {
      "letters": "c",
      "sound": "/k/"
     }
    ],
    "tip": "a 在这里仍读 /æ/，轻读不等于所有元音都变成 /ə/。"
   },
   {
    "letters": "tiv",
    "sound": "/tɪv/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "v",
      "sound": "/v/"
     }
    ],
    "tip": "重读元音 /ɪ/ 对应第一个 i，v 对应 /v/。"
   },
   {
    "letters": "i",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "i",
      "sound": "/ə/"
     }
    ],
    "tip": "第二个 i 弱读 /ə/，但拼写不能改成 a 或 e。"
   },
   {
    "letters": "ty",
    "sound": "/ti/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t/"
     },
     {
      "letters": "y",
      "sound": "/i/"
     }
    ],
    "tip": "结尾 y 对应 /i/，美式录音中 t 可能轻拍。"
   }
  ],
  "anchor": {
   "text": "两个 i 在这里分别读 /ɪ/、/ə/，结尾 /i/ 对应 y。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "这里用 /t/ 表示词中的基本辅音，末尾 ty 的 t 在美式自然录音里常轻拍，拼写仍保留 t。"
 },
 {
  "headword": "advice",
  "ipa": "/ədˈvaɪs/",
  "chunks": [
   {
    "letters": "ad",
    "sound": "/əd/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     },
     {
      "letters": "d",
      "sound": "/d/"
     }
    ],
    "tip": "开头 a 弱读 /ə/，后面的 /d/ 对应 d。"
   },
   {
    "letters": "vice",
    "sound": "/vaɪs/",
    "stress": "primary",
    "hint": "e 不单独发音",
    "pairs": [
     {
      "letters": "v",
      "sound": "/v/"
     },
     {
      "letters": "i",
      "sound": "/aɪ/"
     },
     {
      "letters": "c",
      "sound": "/s/"
     },
     {
      "letters": "e",
      "sound": ""
     }
    ],
    "tip": "c 对应清音 /s/，不是 advise 中的 /z/；末尾 e 不单独发音。"
   }
  ],
  "anchor": {
   "text": "开头a弱读/ə/，vice中c读清音/s/，末尾e不发音。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "afraid",
  "ipa": "/əˈfreɪd/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "开头 a 轻短地读 /ə/。"
   },
   {
    "letters": "fraid",
    "sound": "/freɪd/",
    "stress": "primary",
    "hint": "ai 整体对应 /eɪ/",
    "pairs": [
     {
      "letters": "f",
      "sound": "/f/"
     },
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "ai",
      "sound": "/eɪ/"
     },
     {
      "letters": "d",
      "sound": "/d/"
     }
    ],
    "tip": "ai 合起来对应 /eɪ/，不是只写一个 a；末尾 d 也要保留。"
   }
  ],
  "anchor": {
   "text": "开头a轻读/ə/，ai合读/eɪ/不能只写a，末尾d要保留。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "already",
  "ipa": "/ɔːlˈred.i/",
  "chunks": [
   {
    "letters": "al",
    "sound": "/ɔːl/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ɔː/"
     },
     {
      "letters": "l",
      "sound": "/l/"
     }
    ],
    "tip": "这里 al 对应 /ɔːl/，不要漏掉 l。"
   },
   {
    "letters": "rea",
    "sound": "/re/",
    "stress": "primary",
    "hint": "ea 整体对应 /e/",
    "pairs": [
     {
      "letters": "r",
      "sound": "/r/"
     },
     {
      "letters": "ea",
      "sound": "/e/"
     }
    ],
    "tip": "重读的 ea 在这个词里对应 /e/，不是 /iː/。"
   },
   {
    "letters": "dy",
    "sound": "/di/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "d",
      "sound": "/d/"
     },
     {
      "letters": "y",
      "sound": "/i/"
     }
    ],
    "tip": "末尾 y 对应 /i/，/d/ 对应前面的 d。"
   }
  ],
  "anchor": {
   "text": "al读/ɔːl/别漏l，rea中ea读/e/非/iː/，结尾y读/i/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "amazing",
  "ipa": "/əˈmeɪzɪŋ/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "第一个 a 弱读 /ə/，与下一个重读 a 区分。"
   },
   {
    "letters": "ma",
    "sound": "/meɪ/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "m",
      "sound": "/m/"
     },
     {
      "letters": "a",
      "sound": "/eɪ/"
     }
    ],
    "tip": "第二个 a 在重读部分对应 /eɪ/。"
   },
   {
    "letters": "zing",
    "sound": "/zɪŋ/",
    "stress": "none",
    "hint": "ng 整体对应 /ŋ/",
    "pairs": [
     {
      "letters": "z",
      "sound": "/z/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     },
     {
      "letters": "ng",
      "sound": "/ŋ/"
     }
    ],
    "tip": "ng 合起来对应 /ŋ/，这里不另加一个 /ɡ/。"
   }
  ],
  "anchor": {
   "text": "首a弱读/ə/，ma中a读/eɪ/，zing的ng读/ŋ/不加/ɡ/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "appear",
  "ipa": "/əˈpɪr/",
  "chunks": [
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "首字母 a 弱读 /ə/。"
   },
   {
    "letters": "ppear",
    "sound": "/pɪr/",
    "stress": "primary",
    "hint": "pp 整体对应 /p/",
    "pairs": [
     {
      "letters": "pp",
      "sound": "/p/"
     },
     {
      "letters": "ear",
      "sound": "/ɪr/"
     }
    ],
    "tip": "pp 对应一个 /p/，ear 在这个美式读法中对应 /ɪr/。"
   }
  ],
  "anchor": {
   "text": "首字母a弱读/ə/，pp只对应一个/p/，ear读/ɪr/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/us/pronunciation/english/appear"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "area",
  "ipa": "/ˈeriə/",
  "chunks": [
   {
    "letters": "ar",
    "sound": "/er/",
    "stress": "primary",
    "hint": "这一段读得最突出",
    "pairs": [
     {
      "letters": "a",
      "sound": "/e/"
     },
     {
      "letters": "r",
      "sound": "/r/"
     }
    ],
    "tip": "美式读法开头 a 对应 /e/，后面接 /r/，不要按字母名 /eɪ/ 读。"
   },
   {
    "letters": "e",
    "sound": "/i/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "e",
      "sound": "/i/"
     }
    ],
    "tip": "中间 e 对应 /i/，与最后的 a 分开记。"
   },
   {
    "letters": "a",
    "sound": "/ə/",
    "stress": "none",
    "hint": "元音弱读，拼写保留",
    "pairs": [
     {
      "letters": "a",
      "sound": "/ə/"
     }
    ],
    "tip": "最后 a 对应轻短的 /ə/，拼写保留两个 a。"
   }
  ],
  "anchor": {
   "text": "开头 a 读 /e/，中间 e 读 /i/，结尾 a 弱读 /ə/。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/us/dictionary/english/area"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  }
 },
 {
  "headword": "article",
  "ipa": "/ˈɑːr.t̬ɪ.kəl/",
  "chunks": [
   {
    "letters": "ar",
    "sound": "/ɑːr/",
    "stress": "primary",
    "hint": "ar 整体对应 /ɑːr/",
    "pairs": [
     {
      "letters": "ar",
      "sound": "/ɑːr/"
     }
    ],
    "tip": "开头 ar 整体对应美式 /ɑːr/，这一段重读。"
   },
   {
    "letters": "ti",
    "sound": "/t̬ɪ/",
    "stress": "none",
    "hint": "字母与声音依次对应",
    "pairs": [
     {
      "letters": "t",
      "sound": "/t̬/"
     },
     {
      "letters": "i",
      "sound": "/ɪ/"
     }
    ],
    "tip": "这里 /t̬/ 表示美式轻拍音，也常记作 /ɾ/，拼写仍是 t。"
   },
   {
    "letters": "cle",
    "sound": "/kəl/",
    "stress": "none",
    "hint": "le 整体对应 /əl/",
    "pairs": [
     {
      "letters": "c",
      "sound": "/k/"
     },
     {
      "letters": "le",
      "sound": "/əl/"
     }
    ],
    "tip": "c 对应 /k/，le 整体对应 /əl/，不要漏掉末尾 e。"
   }
  ],
  "anchor": {
   "text": "ar重读读/ɑːr/，ti中t为轻拍音拼作t，cle中le读/əl/别漏e。"
  },
  "sources": [
   {
    "label": "CMUdict · 美式音素与重音",
    "url": "https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
   },
   {
    "label": "Cambridge · 读音对照",
    "url": "https://dictionary.cambridge.org/us/pronunciation/english/article"
   }
  ],
  "review": {
   "status": "reviewed",
   "reviewedAt": "2026-10-20",
   "draftedBy": "本地 Coder 起草；Codex 重写映射并审核"
  },
  "variantNote": "这里的 /t̬/ 表示美式轻拍音，也常记作 /ɾ/。字母—发音表按这个美式读法整理；英式常保留 /t/，ar 通常不带 /r/。"
 }
] satisfies SoundSpellingLesson[];
