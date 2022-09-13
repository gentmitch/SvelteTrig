<script>
  import { writable } from 'svelte/store';
  export const saves = writable({
    saves: [],
    update: (config) => this.saves = [...this.saves, config],
    remove: (index) => this.saves.splice(index,1)
  })
</script>