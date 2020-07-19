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
  <section>
    <h1>Oops, you've found an uncultivated land.</h1>

    <p>The link you've just clicked no longer exists. :/</p>
  </section>
</Layout>
