--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'buyer',
    'seller',
    'admin'
);


--
-- Name: application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: message_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_type AS ENUM (
    'text',
    'image',
    'file',
    'action'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'order',
    'message',
    'broadcast',
    'system'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'completed',
    'disputed'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'earning',
    'refund'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'buyer',
    'seller',
    'admin'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, balance_leones)
  VALUES (NEW.id, 0);
  
  -- Assign default buyer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    target_id uuid,
    target_type text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: broadcasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broadcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    image_url text,
    link_url text,
    sender_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message_type public.message_type DEFAULT 'text'::public.message_type NOT NULL,
    body text,
    attachments text[] DEFAULT '{}'::text[],
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    type public.notification_type NOT NULL,
    image_url text,
    link_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    shipping_country text,
    shipping_region text,
    shipping_city text,
    shipping_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_counter; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_counter
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    store_id uuid NOT NULL,
    product_code text DEFAULT ('#360-'::text || lpad((nextval('public.product_counter'::regclass))::text, 8, '0'::text)) NOT NULL,
    title text NOT NULL,
    brand text,
    model_number text,
    description text,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    hs_code text,
    warranty text,
    origin text,
    material text,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    price numeric(10,2) NOT NULL,
    moq integer DEFAULT 1,
    inquiry_only boolean DEFAULT false,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    name text,
    phone text,
    avatar_url text,
    country text,
    region text,
    city text,
    role public.user_role DEFAULT 'buyer'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seller_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_applications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    contact_person text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text NOT NULL,
    business_category text NOT NULL,
    business_description text,
    store_logo_url text,
    store_banner_url text,
    id_front_url text,
    id_back_url text,
    business_cert_url text,
    proof_of_address_url text,
    how_heard_about text,
    status public.application_status DEFAULT 'pending'::public.application_status NOT NULL,
    reviewer_id uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    store_description text,
    store_address text,
    store_city text,
    store_region text,
    store_country text DEFAULT 'Sierra Leone'::text,
    business_registration_number text,
    tax_id text,
    bank_account_name text,
    bank_account_number text,
    bank_name text
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    store_name text NOT NULL,
    logo_url text,
    banner_url text,
    description text,
    country text,
    region text,
    city text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    type public.transaction_type NOT NULL,
    reference text,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wallet_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    phone_number text NOT NULL,
    screenshot_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wallet_requests_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT wallet_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT wallet_requests_type_check CHECK ((type = ANY (ARRAY['deposit'::text, 'withdrawal'::text])))
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    balance_leones numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: broadcasts broadcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broadcasts
    ADD CONSTRAINT broadcasts_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: seller_applications seller_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_pkey PRIMARY KEY (id);


--
-- Name: stores stores_owner_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_owner_id_key UNIQUE (owner_id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: wallet_requests wallet_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_requests
    ADD CONSTRAINT wallet_requests_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: products_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_search_idx ON public.products USING gin (to_tsvector('english'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(category, ''::text))));


--
-- Name: orders set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: products set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: seller_applications set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.seller_applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: stores set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: wallets set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: wallet_requests update_wallet_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_wallet_requests_updated_at BEFORE UPDATE ON public.wallet_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: broadcasts broadcasts_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broadcasts
    ADD CONSTRAINT broadcasts_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seller_applications seller_applications_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);


--
-- Name: seller_applications seller_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_applications
    ADD CONSTRAINT seller_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stores stores_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wallet_requests wallet_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_requests
    ADD CONSTRAINT wallet_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: wallet_requests wallet_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_requests
    ADD CONSTRAINT wallet_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: broadcasts Admins can create broadcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create broadcasts" ON public.broadcasts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seller_applications Admins can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update applications" ON public.seller_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wallet_requests Admins can update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update requests" ON public.wallet_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seller_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.seller_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wallet_requests Admins can view all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all requests" ON public.wallet_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: broadcasts Admins can view broadcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view broadcasts" ON public.broadcasts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Anyone can view published products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published products" ON public.products FOR SELECT USING ((published = true));


--
-- Name: stores Anyone can view published stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published stores" ON public.stores FOR SELECT USING (true);


--
-- Name: orders Buyers can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: orders Buyers can update own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can update own orders" ON public.orders FOR UPDATE USING ((auth.uid() = buyer_id));


--
-- Name: orders Buyers can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: orders Sellers can update store orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update store orders" ON public.orders FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: orders Sellers can view store orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view store orders" ON public.orders FOR SELECT USING ((auth.uid() = seller_id));


--
-- Name: products Store owners can create products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can create products" ON public.products FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = products.store_id) AND (stores.owner_id = auth.uid())))));


--
-- Name: stores Store owners can create store; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can create store" ON public.stores FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: products Store owners can delete own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can delete own products" ON public.products FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = products.store_id) AND (stores.owner_id = auth.uid())))));


--
-- Name: products Store owners can update own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can update own products" ON public.products FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = products.store_id) AND (stores.owner_id = auth.uid())))));


--
-- Name: stores Store owners can update own store; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can update own store" ON public.stores FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: products Store owners can view own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can view own products" ON public.products FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = products.store_id) AND (stores.owner_id = auth.uid())))));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: transactions System can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);


--
-- Name: seller_applications Users can create applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create applications" ON public.seller_applications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: messages Users can create messages in own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in own conversations" ON public.messages FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))))) AND (auth.uid() = sender_id)));


--
-- Name: wallets Users can create own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own wallet" ON public.wallets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wallet_requests Users can create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create requests" ON public.wallet_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: messages Users can view messages in own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))))));


--
-- Name: seller_applications Users can view own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own applications" ON public.seller_applications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations Users can view own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wallet_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.wallet_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.wallets
  WHERE ((wallets.id = transactions.wallet_id) AND (wallets.user_id = auth.uid())))));


--
-- Name: wallets Users can view own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: broadcasts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles user_roles_service_role_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_service_role_all ON public.user_roles USING (true) WITH CHECK (true);


--
-- Name: wallet_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallet_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


