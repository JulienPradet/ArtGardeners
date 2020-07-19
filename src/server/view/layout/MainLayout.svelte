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

  export let locale;
  export let data;

  setCurrentLocale(locale);

  const user = data.user;
  const updates = 5;
</script>

<style>
  :global(body) {
    margin: 0;
  }
</style>

<header>
  <h1>
    <a href="/">{_('ArtGardeners')}</a>
  </h1>
  <nav>
    <ul>
      <li>
        {#if data.user}
          <a href="/account">Account</a>
        {:else}
          <a href="/login">Login</a>
        {/if}
      </li>
      <li>
        {_('Updates ({value, plural, =0 {none} other {{value}}}) {value2}', {
          values: {
            value: updates,
            value2: 2
          }
        })}
      </li>
      <li>Discussions</li>
    </ul>
  </nav>
</header>
<slot />
