If we need file uploads, to support larger files, it should be client side, and the metadata/url should be passed to backend. Take care of signature when client side upload, depending on the library user decides

Use production grade sde2 level clean architecture for backend i.e. controllers/routes should call services(BL) which should call repositories(DB specific queries) in case of node.js app. Use the known best practice in case of next.js. Implement tests wherever applicable

Use production grade sde2 level architecture for frontend as well. For React, components should use hooks if needed, react-query if needed, services, common apiclient, no db calls from frontend. For next.js, use the known best practice considering server components as well wherever needed. When to use Server Components (The Default) - You should call your backend logic (Services/Repositories) directly inside a Server Component whenever you are rendering a page. You should only use API Routes when it is absolutely needed. Use appropriate error boundary and handling. Implement tests wherever applicable

Use frontend skills for modern clean landing page with subtle animations. It should reflect clearly what problem app solves with engaging Hero section, core clear features, how it practically solves the problem, how it works internally without jargon, professional navbar and footer. When updating/adding/removing core important features, landing page should be updated with that. Entire UI should be modern minimal, extremely easy and good UX. Should be responsive across all screen sizes. Use frontend skills

Use vercel ai sdk and standard tooling for any ai functionality within app. Use the free gemini flash model available. Since I’ll be building demos, try to keep everything free and best in class, but providing options along with trade-offs

Use clerk for authentication wherever possible
