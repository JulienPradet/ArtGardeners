<script context="module">
  export const preload = async (prisma, request) => {
    return {
      user: request.user
        ? await prisma.user.findOne({
            where: { id: request.user.id },
            select: { id: true, email: true }
          })
        : null
    };
  };
</script>

<script>
  import { _, setCurrentLocale } from "../modules/intl";
  import Header from "./Header.svelte";
  import Navigation from "./Navigation.svelte";
  import Container from "./Container.svelte";

  export let locale;
  export let data;
  export let title;

  setCurrentLocale(locale);

  const user = data.user;
  const updates = 5;
</script>

<style>
  :root {
    --c-blue-400: #151a42;
    --c-blue-500: #090b1c;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: Raleway, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
      Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
      sans-serif;
    font-style: normal;
    font-size: 1em;
    line-height: 1.4;
    color: #ffffff;
    background: var(--c-blue-500);
  }

  .head {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
  }

  .nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .content {
    margin-bottom: 5rem;
  }
</style>

<div class="head">
  <Header {title} />
</div>
<div class="nav">
  <Navigation />
</div>
<div class="content">
  <slot />
</div>
