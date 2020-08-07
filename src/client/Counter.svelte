<script>
  let counter = 0;

  const increment = () => {
    counter = counter + 1;
  };
</script>

<template tag="div">
  {counter}
  <button on:click={increment}>Increment</button>
</template>
