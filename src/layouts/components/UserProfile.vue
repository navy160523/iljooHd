<script setup>
import { useUserStore } from '@hiway/stores/user'
import { storeToRefs } from 'pinia'
import { useTheCustomizer } from '@core/composable/useTheCustomizer'


const userStore = useUserStore()

const { isCustomizerOpen } = useTheCustomizer()

const isLoggedIn = computed(() => {
  return userStore.userId ? true : false  
})

const logout = () => {
  // authToken 삭제  
  userStore.logout()          
}
</script>

<template>  
<!-- @click="OpenPopUp" -->
<VBtn icon variant="text" color="primary" size="small">
  <VAvatar
    class="cursor-pointer"
  >
    <!-- <VIcon>
      mdi-account-outline
    </VIcon> -->
    <svg-icon name="person"/>
    <!-- SECTION Menu -->
    <VMenu
      activator="parent"
      width="230"
      location="bottom end"
      offset="14px"
    >
      <VList>
        <!-- 👉 User Avatar & Name -->
        <VListItem>
          <template #prepend>
            <VListItemAction start>              
              <VAvatar
                color="primary"
                variant="tonal"
              >
              <svg-icon name="person"/>
                <!-- <VIcon>
                  mdi-account-outline
                </VIcon> -->
              </VAvatar>              
            </VListItemAction>
          </template>

          <VListItemTitle class="font-weight-medium">
            {{ userStore.userName }}
          </VListItemTitle>            
        </VListItem>
        <VDivider class="my-2" />

        <!-- 👉 Profile -->
        <VListItem        
          v-if="isLoggedIn"
          link
          to="/my-page"
        >
          <template #prepend>
            <VIcon
              class="me-2"
              icon="mdi-account-outline"
              size="22"
            />
          </template>

          <VListItemTitle>Profile</VListItemTitle>
        </VListItem>

        <!-- 👉 Settings -->
        <!-- <VListItem @click="isCustomizerOpen = true">
          <template #prepend>
            <VIcon
              class="me-2"
              icon="mdi-cog-outline"
              size="22"
            />
          </template>

          <VListItemTitle>Settings</VListItemTitle>
        </VListItem>          -->
        <!-- Divider -->
        <VDivider class="my-2" />

        <!-- 👉 Logout -->
        <VListItem
          v-if="isLoggedIn"
          @click="logout"
        >
          <template #prepend>
            <VIcon
              class="me-2"
              icon="mdi-logout"
              size="22"
            />
          </template>

          <VListItemTitle>Logout</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <!-- !SECTION -->
  </VAvatar>  
</VBtn>
</template>
