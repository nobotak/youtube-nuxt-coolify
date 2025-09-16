<template>
  <div class="flex h-screen dark bg-gray-900 text-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div class="p-6">
        <h1 class="text-xl font-semibold">YT Manager</h1>
      </div>
      <nav class="mt-6">
        <ul>
          <li>
            <NuxtLink to="/" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="mr-3">📊</span>
              Dashboard
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/channels" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="mr-3">📺</span>
              Channels
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/videos" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="mr-3">🎬</span>
              Videos
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/captions" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <span class="mr-3">📝</span>
                Captions
            </NuxtLink>
          </li>
           <li>
            <NuxtLink to="/downloads" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="mr-3">📁</span>
              Downloads
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/settings" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="mr-3">⚙️</span>
              Settings
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
