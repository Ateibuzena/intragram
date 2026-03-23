import { useState } from 'react';

export const usePost = (initialLiked: boolean, initialLikes: number) => {
  const [liked, setLiked]               = useState(initialLiked);
  const [likes, setLikes]               = useState(initialLikes);
  const [saved, setSaved]               = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);

  const handleLike = () => {
    setAnimatingLike(true);
    setLiked(prev => !prev);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    setTimeout(() => setAnimatingLike(false), 400);
  };

  const handleSave = () => {
    setAnimatingSave(true);
    setSaved(prev => !prev);
    setTimeout(() => setAnimatingSave(false), 400);
  };

  return { liked, likes, saved, animatingLike, animatingSave, handleLike, handleSave };
};
