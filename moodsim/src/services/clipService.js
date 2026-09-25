import videosData from '../data/videos_data.json';

// Get all clips organized by emotion
export const getAllClips = () => {
  const allClips = [];
  const emotions = ['anger', 'sadness', 'happiness', 'neutral', 'excited', 'frustration'];
  
  emotions.forEach(emotion => {
    if (videosData[emotion]) {
      videosData[emotion].forEach(clip => {
        allClips.push({
          ...clip,
          category: emotion
        });
      });
    }
  });
  
  return allClips;
};

// Get clips by emotion category
export const getClipsByCategory = (category) => {
  if (category === 'all') return getAllClips();
  if (!videosData[category]) return [];
  return videosData[category].map(clip => ({
    ...clip,
    category: category
  }));
};

// Get all emotion categories with counts
export const getCategoryCounts = () => {
  const counts = {};
  const emotions = ['anger', 'sadness', 'happiness', 'neutral', 'excited', 'frustration'];
  
  emotions.forEach(emotion => {
    counts[emotion] = videosData[emotion] ? videosData[emotion].length : 0;
  });
  
  return counts;
};

// Get a clip by filename
export const getClipByFilename = (filename) => {
  const allClips = getAllClips();
  return allClips.find(clip => clip.filename === filename);
};