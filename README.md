<div dir="rtl">

# 💪 מעקב מסה — Bulk Tracker

אפליקציית אנדרואיד למעקב קלוריות וחלבון, ממוקדת **עלייה במסת שריר**. נבנתה ב‑React Native / Expo, עם **אחסון 100% מקומי** במכשיר (בלי שרת, בלי Firebase).

---

## 📲 הורדת האפליקציה (APK)

<div align="center">

### [⬇️ לחץ כאן להורדת ה‑APK האחרון](../../releases/latest/download/bulk-tracker.apk)

[![הורד APK](https://img.shields.io/badge/⬇️_הורד_APK-התקן_בטלפון-2ea44f?style=for-the-badge&logo=android&logoColor=white)](../../releases/latest/download/bulk-tracker.apk)
&nbsp;
[![Build APK](../../actions/workflows/build-apk.yml/badge.svg)](../../actions/workflows/build-apk.yml)

</div>

> **איך מתקינים:**
> 1. פתח את הקישור הירוק למעלה **מהטלפון** (או היכנס ללשונית [**Releases**](../../releases/latest)).
> 2. הורד את הקובץ `bulk-tracker.apk`.
> 3. פתח אותו — אנדרואיד יבקש לאשר *"התקנה ממקור לא ידוע"*, אשר והתקן.
>
> אם זו הפעם הראשונה אחרי דחיפת קוד — הבנייה ב‑GitHub Actions לוקחת בערך **15 דקות**, ואז ה‑APK יופיע ב‑Releases.

---

## ✨ מה יש באפליקציה

- **פרופיל ויעדים** — גובה/משקל/גיל/מין/רמת פעילות/עצימות בנייה (ברירת מחדל 190 ס״מ / 60 ק״ג). יעד קלוריות וחלבון יומי **מחושב אוטומטית** לעודף קלורי (נוסחת Mifflin‑St Jeor + 2 גרם חלבון לק״ג).
- **רישום מזון** — מאגר מזון מובנה (טוסט, חזה עוף, אורז, ביצים ועוד) + יצירת **מזונות מותאמים אישית**. מסך בית עם **פסי התקדמות** לקלוריות וחלבון ויומן יומי.
- **תזכורות** — התראות מקומיות בזמני ארוחה, עם **מתג הפעלה/כיבוי** בהגדרות.
- **פרטיות מלאה** — כל הנתונים נשמרים מקומית (AsyncStorage). שום מידע לא יוצא מהמכשיר.
- ממשק **עברית מלא עם תמיכת RTL** ועיצוב כהה.

---

## 🛠️ הרצה מקומית (לפיתוח)

</div>

```bash
npm install
npx expo start        # סרוק את ה-QR עם אפליקציית Expo Go
```

<div dir="rtl">

## 🤖 איך נבנה ה‑APK

הקובץ [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) רץ בכל `push`:
מריץ `expo prebuild` → בונה עם Gradle (`assembleRelease`) → מעלה את ה‑APK גם כ‑**Artifact** וגם כ‑**Release** בשם `latest`. אין צורך בחשבון EAS או בסודות כלשהם — הבנייה חתומה במפתח ה‑debug, מה שמתאים להתקנה ידנית בטלפון.

</div>
