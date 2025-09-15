<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Videos with Captions</h1>

        <div v-if="pending" class="text-center">Loading...</div>
        <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
        
        <div v-else class="bg-white p-6 rounded-lg shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published At</th>
                </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="video in videosWithCaptions" :key="video.video_id">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ video.title }}</div>
                        <div class="text-sm text-gray-500">{{ video.video_id }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ video.channel_name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ new Date(video.published_at).toLocaleDateString() }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
const { data: videos, pending, error, refresh } = await useFetch('/api/videos');

const videosWithCaptions = computed(() => {
    if (!videos.value) return [];
    return videos.value.filter((v: any) => v.captions && v.captions !== 'null');
});
</script>
