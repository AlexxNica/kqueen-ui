
function topology_data_transform(clusterData) {

  var relations = [];

  // Basic Transformation Array > Object with UID as Keys
  const transformedData = clusterData.reduce(function(acc, cur) {
    acc[cur.metadata.uid] = cur
    return acc
  }, {})

  // Add Containers as top-level resource
  let resource;
  for (resource in transformedData) {
    resource = transformedData[resource]
    if (resource.kind === 'Pod') {
      for (let container of resource.spec.containers) {
        let containerId = `${resource.metadata.uid}-${container.name}`
        transformedData[containerId] = { }
        transformedData[containerId].metadata = container
        transformedData[containerId].kind = 'Container'

        // Add to relations
        relations.push({ target: containerId, source: resource.metadata.uid })
      }
    }
  }

  let item, kind

  for (item of clusterData) {
    kind = item.kind
    if (kind === 'Pod') {
      let pod = item
      // define relationship between pods and nodes
      let podsNode = clusterData.find(i => i.metadata.name === pod.spec.nodeName)
      if(podsNode){
         relations.push({source: pod.metadata.uid, target: podsNode.metadata.uid})
      }else{
         console.log("Cannot found pods node!")
      }
      // define relationships between pods and rep sets and replication controllers
      if(pod.metadata.ownerReferences){
        let ownerReferences = pod.metadata.ownerReferences[0].uid
        let podsRepController = clusterData.find(i => i.metadata.uid === ownerReferences)
        relations.push({target: pod.metadata.uid, source: podsRepController.metadata.uid})
      }else{
         console.log("Cannot found owner references!")
      }


      // rel'n between pods and services
      let podsService = clusterData.find(i => {
        if (i.kind === 'Service' && i.spec.selector) {
          return i.spec.selector.run === pod.metadata.labels.run
        }
      })
      relations.push({target: pod.metadata.uid, source: podsService.metadata.uid})
    }

    if (kind === 'Service') {
      let podsService
      // console.log('item', item)
      // console.log(item.spec.selector)
    }

    if (kind === 'Deployment') {
      // console.log('item deployment', item)
    }
  }

  const items = transformedData
  return {items: items, relations: relations}
}
