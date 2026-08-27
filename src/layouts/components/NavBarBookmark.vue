<script setup>
import { useMenuStore } from "@hiway/stores/menu";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { deleteMyMenus, addMyMenus } from "@hiway/api/menu";
import notify from "@hiway/utils/notify";
//  즐겨찾기 팝업
import bookmarkPopUp from "@/pages/99_indexPopUp/bookmarkPopUp.vue";

const bookmarkPopUpRef = ref(null);

// 옛날 즐겨찾기 로직

// const route = useRoute()
// const menuStore = useMenuStore()
// const { menus, myMenus } = storeToRefs(menuStore)

// // 즐겨찾기 등록 유무
// const isAdded = computed(() => {
//   return myMenus.value.some(menu => {
//     return menu.path === route.path
//   })
// })

// const toggleBookmark = () => {
//   if(isAdded.value) {
//     // 북마크 삭제
//     const index = myMenus.value.findIndex(menu => {
//       return menu.path === route.path
//     })

//     if(index >= 0) {
//       deleteMyMenus([myMenus.value[index]]).then(() => {
//         myMenus.value.splice(index)
//         notify.success('즐겨찾기 메뉴가 삭제 되었습니다.')
//       }).catch(e=> {
//         notify.err('잠시 후 다시 시도해주세요.')
//         menuStore.getMyMenus()
//       })
//     }
//   } else {
//     // 북마크 추가
//     const currentMenu = menus.value.find(menu => {
//       return menu.path === route.path
//     })

//     if(!currentMenu) {
//       notify.warn('권한관리에 등록된 메뉴가 아닙니다.')

//       return
//     }

//     const myMenuLength = myMenus.value.length

//     const params = {
//       app_id: currentMenu.app_id,
//       menu_id: currentMenu.menu_id,
//       mymenu_nme: currentMenu.mnu_nm,
//       node_type: 'M',
//       mnu_seq: myMenuLength === 0 ? 0 : myMenus.value[myMenuLength - 1].mnu_seq + 1,
//     }

//     addMyMenus([params]).then(() => {
//       menuStore.getMyMenus()
//       notify.success('즐겨찾기 메뉴가 등록 되었습니다.')
//     }).catch(() => {
//       notify.err('잠시 후 다시 시도해주세요.')
//     })
//   }
// }

//  종료

const OpenPopUp = () => {
  bookmarkPopUpRef.value.openPopup();
};
</script>

<template>
  <VBtn icon variant="text" color="primary" size="small" @click="OpenPopUp">
    <!-- <VIcon
      icon='mdi-star-outline'    
      size="24"      
    /> -->
    <svg-icon name="bookmark" />
  </VBtn>

  <bookmarkPopUp ref="bookmarkPopUpRef" />
</template>   
