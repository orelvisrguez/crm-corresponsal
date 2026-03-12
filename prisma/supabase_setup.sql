-- Create a trigger that automatically creates a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, "nombreCompleto", email, rol, estado, "updatedAt")
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'visor', 'activo', now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on core tables
alter table public.profiles enable row level security;
alter table public.casos enable row level security;
alter table public.corresponsales enable row level security;
alter table public.caso_logs enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can do everything on profiles"
  on profiles for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- Policies for Casos
create policy "Casos are viewable by authenticated users"
  on casos for select
  to authenticated
  using (true);

create policy "Admins and Operadores can insert/update casos"
  on casos for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and (rol = 'admin' or rol = 'operador')
    )
  );

-- Repeat similar for corresponsales and logs...
