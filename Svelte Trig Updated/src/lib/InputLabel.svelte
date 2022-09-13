<script>
  export let checked = null;
  export let labelText = 'Label';
  export let name = '';
  export let type = 'checkbox';
  export let value = 1;
  export let step = 1;
  export let min = 1;
  export let max = 1;
</script>

{#if type === 'checkbox'}
  <div>
    <label for={name}>{labelText}</label>
    <input bind:checked type="checkbox" {name} />
  </div>
{/if}

{#if type === 'range'}
  <div>
    <label for={name}>{labelText}</label>
    <input bind:value {min} {max} step={step} type="range" {name} />
  </div>
{/if}

<style>
  input {
    margin: 10px;
  }
  div {
    margin: 5px 10px 5px 0;
  }
</style>
