<script>
  import Container from "./Container.svelte";
</script>

<style>
  nav {
    background: var(--c-blue-400);
  }

  ul {
    margin: 0;
    padding: 1rem 0;
    display: flex;
    justify-content: space-evenly;
  }

  li {
    display: block;
    padding: 0;
    text-align: center;
  }

  a {
    color: #ffffff;
  }
</style>

<nav>
  <Container>
    <ul>
      <li>
        <a href="">Reviews</a>
      </li>
      <li>
        <a href="">Publish</a>
      </li>
      <li>
        <a href="">Discussions</a>
      </li>
    </ul>
  </Container>
</nav>
