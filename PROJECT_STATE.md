# HAVI NAPTÁR — PROJECT_STATE
Utolsó ellenőrzés: 2026-10-13. Ez a fájl a több chaten átívelő fejlesztés átadási dokumentuma. Nem helyettesíti a forráskód és az éles konfiguráció ellenőrzését.

## Azonosítók és linkek
- GitHub: https://github.com/FasiSandor/havi-naptar
- Éles alkalmazás: https://havi-naptar.vercel.app
- Vercel projekt: havi-naptar, projekt ID: prj_Fcnmd6XdvZqnS0GAGFBR19UWThjG
- Production branch: main
- Utolsó igazolt sikeres production commit: 85fb53967a8beb63e56bea6328a860e1bd57ba2f (2026-10-13, READY).
- Calendar Core GitHub: https://github.com/FasiSandor/calendar-core
- Calendar Core production: https://calendar-core.vercel.app
- Calendar Core Vercel projekt ID: prj_k42V09Juc0GRhe0BJux4984Yk2Ia
- Calendar Core utolsó itt ellenőrzött funkcionális commit: e615c05ed8f93dd398fe9bff98644ba02af78d95
- Canonical Calendar Core adatbázis: Neon, projekt `Szemelyes-Kozpont`, ID `proud-smoke-86266843`, `calendar_core.calendar_events`.
- Google háttérszinkron: Supabase projekt ID `syzpkrypgcwiyzzzlzzi`, Edge Function `calendar-core-google-pull`, legutóbb telepített verzió v5.
- Ütemezés: Supabase pg_cron job ID 8, történeti neve `calendar-core-google-pull-30m`, AKTUÁLIS schedule `*/15 * * * *`, active = true. A név már nem tükrözi a 15 perces gyakoriságot.
- OAuth tokenek és titkok kezelése: Supabase védett beállítások és `public.naptar_service_secret`. Titkokat tilos forráskódba vagy ebbe a fájlba másolni.

## Cél és elfogadott megjelenés
Mobil-first HAVI NAPTÁR iPhone/iPad/Mac használatra. A jelenlegi elfogadott naptárnézetet és dizájnt nem szabad kérés nélkül újratervezni. Több időtartam (heti / többhetes / havi / lista), naptárkategóriák, eseményszerkesztés, Google- és Core-kapcsolat, szinkron és diagnosztika. Alapelvek: egyszeri adatbevitel, duplikációk elkerülése, megbízható iPhone–Google–Core–HAVI adatáramlás, költségkímélő Vercel deploy.

## Megvalósított és ellenőrzött
- PR #13: Google → Calendar Core meglévő összekapcsolt események visszaszinkronja és Google-lapozás, valamint az alkalmazás megnyitásakor reconciliation.
- Supabase háttér-pull: a Google elsődleges naptárából a Core-ban ismert összekapcsolt események frissítése/törlésjelzése zárt HAVI mellett; ütemezés 15 perc.
- A születésnapok importálása később bővült: az aktuális év Google elsődleges naptárában található egész napos születésnapi előfordulások importja. Nem teljes általános Google-esemény-import.
- PR #14: azonos napi, azonos személyű születésnapi névváltozatok megjelenítési összevonása.
- PR #15: `repeat: yearly` Core-események következő éves előfordulásainak virtuális megjelenítése a látható tartományban, új DB-rekord készítése nélkül, meglévő Google-előfordulás előnyben részesítésével. Preview és production READY.
- Olika 2026-10-25 egész napos születésnapja iPhone helyi naptárból Google főnaptárba került, majd Core és HAVI felületen is ellenőrzötten megjelent. A 2026-os canonical Core rekordon `metadata.repeat=yearly` beállítva. Patrik 2026-10-16 születésnapja is megjelent.
- A 15 perces pg_cron schedule `*/15 * * * *` aktív, SQL-lekérdezéssel ellenőrizve.

## Fontos korlátok és ismert hibák (NEM kész)
1. A korábbi születésnap-import Olika ismétlődéseiből 74 külön Core-rekordot hozott létre 2026–2099 között. Ezek egyedi Google occurrence ID-khoz kapcsolódnak; még nem archiváltuk/töröltük őket. A jövő éviek megtartása jelenleg adatbiztonsági döntés. Minden törlés előtt bizonyítani kell a Google-sorozat és kivételek kezelését, mentést és rollbacket.
2. A jelenlegi háttér-pull csak a Google `primary` naptárát olvassa a beállított kapcsolatoknál; másodlagos vagy iPhone `A saját eszközön` naptárakat NEM lát automatikusan.
3. A sync nem általános, teljes kétirányú szinkron; a Google-oldali új, nem születésnap típusú események Core-importja nincs általánosan megoldva. A 15 perc polling, NEM valós idejű push.
4. A `yearly` virtuális előfordulás megjelenítési megoldás korlátozott; Google kivételek, egyedi előfordulás szerkesztése/törlése, évváltás és több eszköz tesztje szükséges.
5. Korábbi ismételt háttér-pull futások alkalmával kisebb számú újrafrissítés történt; idempotencia mélyebb ellenőrzése szükséges.
6. Teljes szinkronhiba-/kapcsolatjelző és értesítések ellenőrzése még hátravan. PWA nem garantálhat iOS zárolt képernyőn korlátlanul ott maradó, méretezhető saját értesítést.
7. Ne mossuk össze az iOS Naptár felületen látható összes fiókot a tényleges Google Calendar primary tartalmával.

## Következő fejlesztési sorrend
A. Regressziós tesztek: évente ismétlődő események és Google-kivételek, különösen Olika/Patrik a 2026/2027-es nézetben; azonos napra duplikáció ne legyen.
B. Ismétlődési modell és Core adatkapcsolatok vizsgálata; teljes mentés, ellenőrzött és visszavonható migráció, csak azután korábbi occurrence másolatok archiválása.
C. Valódi, kétirányú létrehozás/módosítás/törlés szinkron és felhasználó által kiválasztott Google-naptárak támogatása.
D. Szinkronnapló/utolsó sikeres pull státusz, hibajelzés, mobil értesítések tesztje.
E. Vercel Hobby költségkímélés: több változtatás összevonva, egy tesztelt production deploy.

## Fejlesztési és kiadási szabályok
- Minden esetben a meglévő `FasiSandor/havi-naptar` repót és a meglévő Vercel production projektet folytasd; ne hozz létre másodpéldányt.
- Production előtt pontos branch/projekt azonosítása; nagy vagy adatvesztési kockázatú változás előtt tag/backup vagy rollback branch.
- Kód: GitHub branch → teszt/build → PR → merge main → Vercel automatikus production. Ne indíts felesleges kézi redeployt.
- A már elfogadott UI-t csak a kért funkcióhoz szükséges mértékben módosítsd.
- Ne töröljön a rendszer automatikusan Google-eseményeket és canonical Core-eseményeket deduplikáció ürügyén.
- Titkos kulcsokat, OAuth refresh tokent és egyéb érzékeny adatokat ne tegyél dokumentumba.
- Chatváltásnál ezt a fájlt olvasd be, majd az élő GitHub/Vercel/DB állapotot külön ellenőrizd.
