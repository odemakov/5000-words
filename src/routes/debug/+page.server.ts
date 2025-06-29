import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to the main page after the client-side logic runs
	throw redirect(302, '/learning');
};
