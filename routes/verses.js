const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Collection of Bible verses (fallback when DB has no entry for today)
const VERSES = [
  { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11' },
  { text: 'Trust in the Lord with all your heart and lean not on your own understanding.', ref: 'Proverbs 3:5' },
  { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', ref: 'Joshua 1:9' },
  { text: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
  { text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.', ref: 'Isaiah 40:31' },
  { text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', ref: 'Psalm 34:18' },
  { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', ref: 'Philippians 4:6' },
  { text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', ref: 'John 3:16' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'The Lord is my light and my salvation—whom shall I fear?', ref: 'Psalm 27:1' },
  { text: 'God is our refuge and strength, an ever-present help in trouble.', ref: 'Psalm 46:1' },
  { text: 'Delight yourself in the Lord, and he will give you the desires of your heart.', ref: 'Psalm 37:4' },
  { text: 'Have I not commanded you? Be strong and courageous.', ref: 'Joshua 1:9' },
  { text: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { text: 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', ref: 'Proverbs 18:10' },
  { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.', ref: 'Galatians 5:22-23' },
  { text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights.', ref: 'James 1:17' },
  { text: 'He has made everything beautiful in its time.', ref: 'Ecclesiastes 3:11' },
  { text: 'The steadfast love of the Lord never ceases; his mercies never come to an end.', ref: 'Lamentations 3:22' },
  { text: 'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.', ref: 'Galatians 6:9' },
  { text: 'This is the day that the Lord has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' },
  { text: 'For where two or three gather in my name, there am I with them.', ref: 'Matthew 18:20' },
  { text: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
  { text: 'In the beginning God created the heavens and the earth.', ref: 'Genesis 1:1' },
  { text: 'Jesus Christ is the same yesterday and today and forever.', ref: 'Hebrews 13:8' },
  { text: 'If God is for us, who can be against us?', ref: 'Romans 8:31' },
  { text: 'Great is our Lord and mighty in power; his understanding has no limit.', ref: 'Psalm 147:5' },
  { text: 'Your word is a lamp for my feet, a light on my path.', ref: 'Psalm 119:105' },
];

// GET /api/verses/today — get daily Bible verse (resets at midnight PHT)
router.get('/today', verifyToken, async (req, res) => {
  try {
    // Get today's date in Philippine Time (UTC+8)
    const phNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const today = phNow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if verse exists in DB for today
    const [rows] = await pool.execute('SELECT * FROM daily_verses WHERE verse_date = ?', [today]);
    if (rows.length > 0) {
      return res.json({ verse: rows[0].verse_text, reference: rows[0].verse_reference });
    }

    // Fallback: pick verse by day-of-year
    const startOfYear = new Date(phNow.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((phNow - startOfYear) / 86400000);
    const verse = VERSES[dayOfYear % VERSES.length];

    // Cache in database
    await pool.execute(
      'INSERT IGNORE INTO daily_verses (verse_text, verse_reference, verse_date) VALUES (?, ?, ?)',
      [verse.text, verse.ref, today]
    );

    res.json({ verse: verse.text, reference: verse.ref });
  } catch (err) {
    console.error('Verse error:', err);
    // Return a verse even if DB fails
    const fallback = VERSES[new Date().getDate() % VERSES.length];
    res.json({ verse: fallback.text, reference: fallback.ref });
  }
});

module.exports = router;
