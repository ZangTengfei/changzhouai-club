update public.events
set
  location_latitude = 31.677251,
  location_longitude = 119.972065
where
  location_latitude is null
  and location_longitude is null
  and (
    venue ilike '%AI Club OPC 共创社区%'
    or (
      venue ilike '%18%号楼%5%楼%'
      and (
        venue ilike '%中以创新园%'
        or venue ilike '%西太湖人工智能国际社区%'
      )
    )
  );
