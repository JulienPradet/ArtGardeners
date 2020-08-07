<script>
  import Container from "./Container.svelte";
  export let title;
</script>

<style>
  header {
    background: var(--c-blue-400);
    color: #ffffff;
  }

  .wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
  }
</style>

<header>
  <Container>
    <div class="wrapper">
      <div>
        <div class="page-title">{title}</div>
      </div>
      <nav>Browse gardens</nav>
    </div>
  </Container>
</header>
