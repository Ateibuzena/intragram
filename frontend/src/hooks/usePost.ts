// Utility hook for managing post interaction state
// (likes, saving, and small associated animations) in the frontend.
import { useEffect, useState } from 'react';

export const usePost = (initialLiked: boolean, initialLikes: number, initialSaved = false) => {
	const [liked, setLiked] = useState(initialLiked);
	const [likes, setLikes] = useState(initialLikes);
	const [saved, setSaved] = useState(initialSaved);
	const [animatingLike, setAnimatingLike] = useState(false);
	const [animatingSave, setAnimatingSave] = useState(false);

	// Resync when the parent's count changes — e.g. Feed patching it live from
	// a 'post:like' broadcast triggered by someone else (or by our own action
	// echoing back once the server confirms it). Doesn't fight the optimistic
	// toggle below: this only fires when the incoming value actually changes.
	useEffect(() => { setLikes(initialLikes); }, [initialLikes]);
	useEffect(() => { setLiked(initialLiked); }, [initialLiked]);

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
