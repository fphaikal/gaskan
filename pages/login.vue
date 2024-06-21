<script setup>
definePageMeta({
  layout: 'blank'
})

import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
const { authenticateUser } = useAuthStore(); // use auth store
const { authenticated } = storeToRefs(useAuthStore()); // make authenticated state reactive
const router = useRouter();

const user = ref({
  NIS: '',
  Password: '',
  force: false
})

const error = ref(false);
const errorMessage = ref('');

const login = async () => {
  error.value = false
  try {
    await authenticateUser(user.value);
    if (authenticated.value) { 
      router.push('/home') 
    }
  } catch (err) {
    error.value = true    
    console.log(err)
    errorMessage.value = err 
  }
};

const forceLogin = async () => {
  user.value.force = true;
  await authenticateUser(user.value);
    if (authenticated.value) { 
      router.push('/home') 
    }
};

</script>
<template>
  <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0 w-full lg:w-1/3">
    <div class="w-full rounded-lg shadow dark:border md:mt-0 xl:p-0 bg-dark dark:border-gray-700 text-white">
      <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 class="text-xl font-bold leading-tight tracking-tight md:text-2xl ">
          Sign in to your account
        </h1>
        <div v-if="error" role="alert" class="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>{{ errorMessage.error }}</span>
          <div>
            <button v-if="errorMessage.code === 400" @click.prevent="forceLogin" class="btn btn-sm btn-primary">Accept</button>
          </div>
        </div>
        <form class="space-y-4 md:space-y-3" action="#">
          <div>
            <label for="email" class="block mb-2 text-sm font-medium ">Username</label>
            <input type="number" name="email" id="email"  v-model="user.NIS"
              class="bg-dark2 border text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600"
              placeholder="Username" required>
          </div>
          <div>
            <label for="password" class="block mb-2 text-sm font-medium">Password</label>
            <input type="password" name="password" id="password" v-model="user.Password" placeholder="••••••••" 
              class="bg-dark2 border text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 mb-2"
              required>
          </div>
          
          <button  @click.prevent="login" type="submit" class="w-full btn btn-primary">Sign in</button>
        </form>
      </div>
    </div>
  </div>
</template>