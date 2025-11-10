# Draft Order Randomizer

A web app for randomizing draft orders with dramatic reveals and royalty-free music.

## Adding Music

To add dramatic tension music to play during randomization:

### Option 1: Download Royalty-Free Music

1. **Download royalty-free dramatic tension music** from one of these sources:
   - **Pixabay**: https://pixabay.com/music/search/dramatic%20tension/ (Free, no attribution required)
   - **Bensound**: https://www.bensound.com/royalty-free-music/track/dramatic-tensions-suspenseful-emotional (Free with attribution)
   - **Free Stock Music**: https://free-stock-music.com/mood.dramatic-suspenseful.html
   - **Chosic**: https://www.chosic.com/free-music/Dramatic/

2. **Place the audio file** in the same directory as `index.html`
3. **Name the file** `draft-music.mp3` (or `draft-music.ogg` for OGG format)
4. The music will automatically play when you click "Randomize Draft Order"

### Option 2: Use Your Own Music

If you have NFL draft music or other dramatic music with proper licensing:
- Place it in the same directory as `index.html`
- Name it `draft-music.mp3`

### Supported Audio Formats
- MP3 (`.mp3`)
- OGG (`.ogg`)

The app will try to load `draft-music.mp3` first, then fall back to `draft-music.ogg` if MP3 is not available.

### Note
If the music doesn't play automatically, it may be due to browser autoplay restrictions. The music will play after user interaction (clicking the randomize button). The music will loop during the reveal and stop automatically when all names are revealed.

