<template>
  <div />
</template>

<script setup>
import { loginSso } from '@hiway/api/sso'
import { getToken } from '@hiway/utils/token'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()
const linkType = ref('');

onMounted(() => {  
  console.log('onMounted userStore.url >> ', userStore.url)

  let urlParams = userStore.url.split('&')
     
  urlParams.forEach(async val => {  
    val = val.split('=')  
    if(val[0] === 'linktype'){  
      console.log('val >> ', val[1])
      linkType.value = val[1]
    }   
  })

  console.log('linkType >> ', linkType.value)


  loginSso().then(() => {
    // Token 값을 기준으로 로그인 여부를 확인한다.
    // Store에 토큰 값이 없으면 로그인 화면으로 이동한다.        
    let token = getToken()
    if (!token) {
      location.reload()
            
      return
    }

    // 새로 화면이 불러오면 user Info 정보를 가져온다.
    // (토큰 값이 있어도 조회가 안될 수 있는 경우) request 상위에서 에러가 발생하면 무시된다.
    userStore.setUserInfo().then(() => {
      // user 정보를 가져온 이후에 이동 및 메뉴 적용
      menuStore.getMenus()
      menuStore.getMyMenus()
      if (route.query.return_url) {
        router.replace(route.query.return_url)
        route.query.return_url = null
      } else {
        router.replace('/')
      }

      if(linkType.value === 'OPEN_MARKET') {
        // Safety Open Market
        router.replace('/40_safety-risk/SRM_D/SRMDA0010')
      } else if(linkType.value === 'SLI_ALL') {
        // SLI 전사
        router.replace('/30_safety/SAF_F/SAFFA0010')
      } else if(linkType.value === 'SLI_DEPT') {
        // SLI 부서
        router.replace('/30_safety/SAF_F/SAFFA0020')
      }
    })
  }).catch(reject => {
    console.log(`통합인증 API Error : ${reject}`)
    router.replace('/')
  })

}) 
</script>
<route lang="yaml">
  meta:
    noAuth: true
    noHistory: true
</route>
