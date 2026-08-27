<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'


const openMeun = ref(false)
const reSultTChildren = reactive({ child: [], three: [], four: [] })
const route = useRoute()
const router = useRouter()
const parents = ref(null)
const SubMeunTitle = ref('')
const inSubTitle =ref('')
const props = defineProps({
  navItems: {
    type: Array,
    required: true,
  },
  navMyMenuItems: {
    type: Array,
    required: true,
  },
})

const open = reactive(['twoLevel그리드 템플릿','threeLevel엑셀다운로드'])

const rtnAtive = ref(false)

//  라우터 변경시
 watch(() => route.path, (oldValue,newValue) => {

  if(oldValue !== '/'){
  const foundArray = findNodeByMenuId(props.navItems, route.path) // 특정 menu_id 값을 찾음
  const PrntMenuId = foundPrntMenuId(props.navItems ,foundArray.prnt_menu_id)
  
  SubMeunTitle.value = PrntMenuId.title

// 디비 부재로 인한 하드코딩 추후 수정예정

  //MN04362 hse 경영
  //MN04238 위험성평가
  //MN04236 안전
  //MN04677 안전리스크
  //MN04237 안전지원
  //MN04239 교육/문화/포상
  //MN04930 운영관리
  //HIWAYMN00061 시스템관리

  switch (PrntMenuId.menu_id) {
  case 'MN04362':
     inSubTitle.value = "Hse Management"
    break
  case 'MN04238':
  inSubTitle.value ="Risk Assessment"
    break
  case 'MN04236':
  inSubTitle.value ="Safety"
    break
  case 'MN04677':
  inSubTitle.value ="Safety Risk"
    break
  case 'MN04237':
  inSubTitle.value ="Safety Support"
    break
  case 'MN04239':
  inSubTitle.value ="Education/Culture/Awards"
    break
  case 'MN04930':
  inSubTitle.value ="Operation Management"
    break
  case 'HIWAYMN00061':
  inSubTitle.value ="System Management"
    break

  default: break
}
  

  
    // 메뉴 가져오기
    valueCheck(undefined,PrntMenuId.title)

  }

  })

  //  서브메뉴 오픈시
  watch(() => openMeun.value, (oldValue,newValue) => {
    
    if(newValue === false){
      const foundArray = findNodeByMenuId(props.navItems, route.path) // 특정 menu_id 값을 찾음
      const PrntMenuId = foundPrntMenuId(props.navItems ,foundArray.prnt_menu_id)
      SubMeunTitle.value = PrntMenuId.title
      valueCheck(undefined,PrntMenuId.title)


      switch (PrntMenuId.menu_id) {
          case 'MN04362':
            inSubTitle.value = "Hse Management"
            break
          case 'MN04238':
          inSubTitle.value ="Risk Assessment"
            break
          case 'MN04236':
          inSubTitle.value ="Safety"
            break
          case 'MN04677':
          inSubTitle.value ="Safety Risk"
            break
          case 'MN04237':
          inSubTitle.value ="Safety Support"
            break
          case 'MN04239':
          inSubTitle.value ="Education/Culture/Awards"
            break
          case 'MN04930':
          inSubTitle.value ="Operation Management"
            break
          case 'HIWAYMN00061':
          inSubTitle.value ="System Management"
            break

          default: break
          }
    }

  })

  



//  현재 라우터 값 들고오기

const findNodeByMenuId = (tree, targetMenuId) => {
      let foundNode = null

      function searchNode(node) {
        if (node.path === targetMenuId) {
          foundNode = node
          return
        }
        if (node.children) {
          for (const child of node.children) {
            searchNode(child)
          }
        }
      }

      for (const node of tree) {
        searchNode(node)
        if (foundNode) {
          break;
        }
      }

      return foundNode
    }
   

    //  최상위 부모 찾기
const foundPrntMenuId = (node, prntMenuId) => {
  let findArr = null
  function returnArr(findAll) {
    if (findAll.menu_id === prntMenuId) {
      let findPrntMenuId = findAll.prnt_menu_id
      findArr = foundPrntMenuId(props.navItems, findPrntMenuId)
      if (findAll.prnt_menu_id === '#') {
        findArr = findAll
        return
      }
    }

    if (findAll.children) {
      for (let findChild of findAll.children) {
        returnArr(findChild)
      }
    }
  }

  for (let findAll of node) {
    returnArr(findAll)
    if (findArr) {
      break
    }
  }

  return findArr
}
    

//  메뉴값 넣기
const valueCheck = (e,BigMeun) => {
  
  parents.value = sessionStorage.getItem('parents')

  if (!e || !e.menu_id) {
    const filterItems = props.navItems.filter(x => x.mnu_nm === BigMeun)
    reSultTChildren.child = filterItems[0]?.children.map(item => ({ ...item, isOpen: false })) || []

  }



}




const toRouterLink= (e)=>{


  if(!e.children){
    if(e !== null)
      router.push(e.path)
    }
}




const openSubMeun = () => {
  localStorage.setItem("openMeun", true)
  openMeun.value = true
}

const closeSubMeum = () => {
  localStorage.setItem("openMeun", false)
  openMeun.value = false
}

defineExpose({
  openSubMeun,
  closeSubMeum
})

</script>

<template>
    <v-layout style="width: 275px;">
      <v-navigation-drawer
        v-model="openMeun"
        :disable-resize-watcher = true
        >
        <v-list-item
          class="firstChild"
          style="padding: 30px 0px;"
          :title="SubMeunTitle"
          :subtitle="inSubTitle"
        ></v-list-item>


        <v-list  class="iljoolist"  >
        <template v-for="(item, i) in reSultTChildren.child" :key="i">
          <!-- 2lev -->
          <v-list-group :value="`twoLevel${item.title}`" >
            <template v-slot:activator="{ props,isOpen }">
              <v-list-item  
              v-bind="props" 
              class="two-Lev"
              :title="item.title" 
              append-icon=""
              :prepend-icon="item.children ? 'mdi-chevron-right' : ''"
              :active="item.children ?  
              isOpen || route.path.includes(item.path) : item.path === route.path || route.path.includes(item.path)"  
              active-class="towLev-V-list-Item-Title-Ative" 
              @click="toRouterLink(item)"    
               
              >
              </v-list-item>
            </template>
            <template  v-if="item.children" v-for="(child, j) in item.children" :key="j">
              <v-list-group :value="`threeLevel${child.title}`">
                <template v-slot:activator="{ props,isOpen }">

                  
                    <!-- 3lev -->
                  <v-list-item 
                  class="three-Lev"
                  v-bind="props" 
                  :title="child.title" 
                  :append-icon="child.children ? 'mdi-chevron-right' : '' "
                  :active="child.children ? isOpen || !!child.children.find(x=>x.path === route.path) : child.path === route.path ? true : child.children ? !!child.children.find(x=>x.path === route.path) : false ? isOpen = false: false"
                  active-class="threeLev-V-list-Item-Title-Ative"
                  @click="toRouterLink(child)" 
                  >
                  </v-list-item>
                </template>

                   <!-- 4lev -->
                <v-list-item
                class="four-Lev"
                  :value="`fourLevel${child4Lev.title}`"
                  v-if="child.children"
                  v-for="(child4Lev, k) in child.children"
                   :title="`&#149 ${child4Lev.title}`" 
                   :key="k"
                   :active="child4Lev.path === route.path "
                   active-class="towLev-V-list-Item-Title-Ative" 
                   @click="toRouterLink(child4Lev)" 
                   >
               
                </v-list-item>
              </v-list-group>
            </template>
          </v-list-group>
        </template>
      </v-list>
      </v-navigation-drawer>
      <v-main style="height: 100vh; max-width: 275px;">
        <div class="d-flex justify-center align-center h-100">
        </div>
      </v-main>
    </v-layout>
</template>


<style>

</style>