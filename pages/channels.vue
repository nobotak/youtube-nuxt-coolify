<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Channels</h1>
      <button @click="showAddChannelModal = true" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600">
        + Add Channel
      </button>
    </div>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading channels.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="channel in channels" :key="channel.id" class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <img :src="channel.thumbnail_url" alt="Channel thumbnail" class="w-16 h-16 rounded-full mr-4">
                <div>
                    <h2 class="text-xl font-bold">{{ channel.channel_name }}</h2>
                    <p class="text-gray-500">{{ channel.channel_id }}</p>
                </div>
            </div>
            <div>
                <button @click="deleteChannel(channel.channel_id)" class="text-red-500 hover:text-red-700">
                    🗑️
                </button>
            </div>
        </div>
      </div>
    </div>
    
    <!-- Add Channel Modal -->
    <div v-if="showAddChannelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-lg w-1/3">
        <h2 class="text-2xl font-bold mb-4">Add New Channel</h2>
        <form @submit.prevent="addChannel">
          <div class="mb-4">
            <label for="channel_id" class="block text-gray-700">Channel ID or URL</label>
            <input type="text" v-model="newChannel.channel_id" id="channel_id" class="w-full px-3 py-2 border rounded-lg" required>
          </div>
          <div class="mb-4">
            <label for="api_key" class="block text-gray-700">API Key (optional)</label>
            <input type="text" v-model="newChannel.api_key" id="api_key" class="w-full px-3 py-2 border rounded-lg">
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddChannelModal = false" class="text-gray-600 mr-4">Cancel</button>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Add Channel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending, error, refresh } = await useFetch('/api/channels');

const showAddChannelModal = ref(false);
const newChannel = ref({
  channel_id: '',
  api_key: '',
});

async function addChannel() {
  await $fetch('/api/channels', {
    method: 'POST',
    body: newChannel.value,
  });
  showAddChannelModal.value = false;
  newChannel.value = { channel_id: '', api_key: '' };
  refresh();
}

async function deleteChannel(channelId: string) {
    if (confirm('Are you sure you want to delete this channel?')) {
        await $fetch(`/api/channels/${channelId}`, {
            method: 'DELETE',
        });
        refresh();
    }
}
</script>
