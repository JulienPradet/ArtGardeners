<script context="module">
  import { preload as preloadLayout } from "../layout/MainLayout.svelte";

  export const preload = async (prisma, request) => {
    const layoutData = await preloadLayout(prisma, request);

    return {
      layoutData
    };
  };
</script>

<script>
  import Layout from "../layout/MainLayout.svelte";
  import { setCurrentLocale } from "../modules/intl";

  export let locale;

  setCurrentLocale(locale);

  export let data;
</script>

<Layout data={data.layoutData}>
  <form method="post" action={'/' + locale + '/login'} novalidate>
    <div>
      <label for="email">Email</label>
      <input type="email" id="email" name="email" />
    </div>
    <div>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" />
    </div>
    <div>
      <button>Login</button>
    </div>
  </form>
</Layout>
