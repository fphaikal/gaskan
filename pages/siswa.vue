<script setup>
const { data } = useFetch(`/api/primary`);

const users = ref([]);
const selectedClass = ref('');
const classOptions = ref([]);

const filteredUsers = computed(() => {
  return users.value.filter(user => 
    user.Kelas !== 'admin' && user.Kelas !== 'developer' && 
    (selectedClass.value === '' || user.Kelas === selectedClass.value)
  );
});

// Watch for changes in data and update users and classOptions accordingly
watch(data, (newData) => {
  if (newData) {
    users.value = Array.isArray(newData) ? newData : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});

onMounted(() => {
  if (data.value) {
    users.value = Array.isArray(data.value) ? data.value : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});
</script>

<template>
  <div>
    <select v-model="selectedClass" class="select select-bordered select-primary bg-dark w-full max-w-xs">
      <option value="">All Classes</option>
      <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
    </select>
    <div class="flex flex-row gap-4" v-for="user in filteredUsers" :key="user.NIS">
      <div class="flex bg-dark w-full mt-2 p-5 rounded-md gap-4">
        <div class="flex w-22">
          <span class="text-white">{{ user.NIS }}</span>
        </div>
        <div class="flex flex-col md:flex-row gap-2 w-full md:justify-between">
          <span class="text-white">{{ user.Nama }}</span>
          <span class="text-white bg-primary rounded-full px-2 py-0.5 text-xs font-medium w-fit">{{ user.Kelas }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
