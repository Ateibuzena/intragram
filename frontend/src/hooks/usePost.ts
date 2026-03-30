// Hook de utilidad para manejar el estado de interacción con un post
// (likes, guardado y pequeñas animaciones asociadas) en el frontend.
import { useState } from 'react';

export const usePost = (initialLiked: boolean, initialLikes: number, initialSaved = false) => {
	const [liked, setLiked] = useState(initialLiked);
	const [likes, setLikes] = useState(initialLikes);
	const [saved, setSaved] = useState(initialSaved);
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
